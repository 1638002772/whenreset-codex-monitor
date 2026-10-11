import unittest
from datetime import datetime, timedelta, timezone

import server


class ResetForecastTests(unittest.TestCase):
    def test_conditional_probabilities_use_intervals_that_have_survived_to_current_age(self):
        probabilities, sample_sizes = server.conditional_interval_probabilities(
            [24, 72, 80, 96, 120, 240],
            elapsed_hours=72,
        )

        self.assertEqual(sample_sizes, {"24": 4, "48": 4, "72": 4})
        self.assertEqual(probabilities, {"24": 50.0, "48": 70.0, "72": 70.0})

    def test_routine_history_excludes_banked_resets_community_reports_and_stale_forecasts(self):
        now = datetime(2026, 10, 11, 2, 30, tzinfo=timezone.utc)

        def event(event_id, hours_ago, category="usage_reset", status="confirmed"):
            timestamp = (now - timedelta(hours=hours_ago)).isoformat().replace("+00:00", "Z")
            return {
                "id": event_id,
                "category": category,
                "status": status,
                "createdAt": timestamp,
                "updatedAt": timestamp,
                "confirmedAt": timestamp if status == "confirmed" else None,
            }

        events = [
            event("older-1", 400),
            event("older-2", 300),
            event("latest-routine", 100),
            event("banked", 1, category="banked_reset"),
            event("community", 20, status="community"),
            event("stale-forecast", 24 * 60, status="forecast"),
        ]

        metrics = server.reset_history_metrics(events, now=now)

        self.assertEqual(metrics["resetCount"], 3)
        self.assertEqual(metrics["lastResetAt"], events[2]["confirmedAt"])
        self.assertEqual(metrics["averageIntervalDays"], 6.2)
        self.assertIsNone(metrics["pendingEventId"])


if __name__ == "__main__":
    unittest.main()
