import os
import unittest
from unittest import mock

import monitor


class MonitorScrapeTests(unittest.TestCase):
    def make_post(self, tweet_id: str, text: str, created_at: str = "2026-10-10T22:16:20Z") -> dict:
        return {
            "id": tweet_id,
            "author": "thsottiaux",
            "createdAt": created_at,
            "text": text,
            "url": f"https://x.com/thsottiaux/status/{tweet_id}",
            "fetchedAt": "2026-10-10T22:20:00Z",
        }

    def test_global_reset_by_eod_is_a_forecast_with_timezone_caveat(self):
        post = self.make_post(
            "2109045392684032299",
            "Global reset by EOD. May the tokens do good things for you.",
        )

        classification = monitor.classify_post(post, [])

        self.assertEqual(classification["category"], "usage_reset")
        self.assertEqual(classification["status"], "forecast")
        self.assertEqual(classification["timeWindow"], "by EOD (timezone not specified)")
        events, result = monitor.apply_post_to_events([], post, notify=True)
        self.assertEqual(len(events), 1)
        self.assertTrue(result["shouldAlert"])
        self.assertIn("原文时间窗：by EOD (timezone not specified)", monitor.event_message(result["event"]))

    def test_global_reset_without_timing_or_usage_context_is_ignored(self):
        post = self.make_post("1", "A global reset can make distributed systems simpler.")

        self.assertIsNone(monitor.classify_post(post, []))

    def test_fetch_retries_once_after_an_unsuccessful_attempt(self):
        post = self.make_post("2", "Codex quota reset is now live")
        with mock.patch.object(
            monitor,
            "fetch_html",
            side_effect=[monitor.ScrapeError("empty X response"), "valid html"],
        ) as fetch_html, mock.patch.object(monitor, "extract_posts", return_value=[post]), mock.patch.object(
            monitor.time, "sleep"
        ) as sleep:
            posts = monitor.fetch_posts_with_retry()

        self.assertEqual(posts, [post])
        self.assertEqual(fetch_html.call_count, 2)
        sleep.assert_called_once_with(2)

    def test_parse_failure_saves_html_then_retries(self):
        post = self.make_post("5", "Codex quota reset is now live")
        with mock.patch.object(monitor, "fetch_html", side_effect=["broken SSR", "valid SSR"]), mock.patch.object(
            monitor,
            "extract_posts",
            side_effect=[monitor.ScrapeError("changed SSR"), [post]],
        ), mock.patch.object(monitor, "save_html_evidence") as save_evidence, mock.patch.object(
            monitor.time, "sleep"
        ):
            posts = monitor.fetch_posts_with_retry()

        self.assertEqual(posts, [post])
        save_evidence.assert_called_once_with("broken SSR")

    def test_fetch_stops_after_one_retry(self):
        with mock.patch.object(
            monitor, "fetch_html", side_effect=monitor.ScrapeError("X unavailable")
        ) as fetch_html, mock.patch.object(monitor.time, "sleep"):
            with self.assertRaisesRegex(monitor.ScrapeError, "X unavailable"):
                monitor.fetch_posts_with_retry()

        self.assertEqual(fetch_html.call_count, 2)

    def test_empty_ssr_response_is_saved_as_diagnostic_evidence(self):
        class FakeHeaders:
            @staticmethod
            def get_content_charset():
                return "utf-8"

        class FakeResponse:
            status = 200
            headers = FakeHeaders()

            @staticmethod
            def read():
                return b"<html>empty page</html>"

            def __enter__(self):
                return self

            def __exit__(self, *_args):
                return False

        with mock.patch.dict(os.environ, {"WHENRESET_X_PROFILE_URL": "https://x.test/profile"}), mock.patch.object(
            monitor.urllib.request, "urlopen", return_value=FakeResponse()
        ), mock.patch.object(monitor, "save_html_evidence") as save_evidence:
            with self.assertRaises(monitor.ScrapeError):
                monitor.fetch_html()

        save_evidence.assert_called_once_with("<html>empty page</html>")

    def test_announcement_and_confirmation_merge_into_one_event(self):
        forecast = self.make_post("3", "Global reset by EOD.")
        confirmation = self.make_post(
            "4",
            "The Codex quota reset is now live.",
            created_at="2026-10-10T23:00:00Z",
        )

        events, _ = monitor.apply_post_to_events([], forecast, notify=False)
        events, result = monitor.apply_post_to_events(events, confirmation, notify=True)

        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["status"], "confirmed")
        self.assertEqual(events[0]["postIds"], ["3", "4"])
        self.assertTrue(result["shouldAlert"])


if __name__ == "__main__":
    unittest.main()
