import unittest
from services.benchmark_runner import ATSBenchmarkRunner
from models.schemas import BenchmarkReportResponse

class TestATSBenchmarkRunner(unittest.TestCase):
    def test_calculate_percentile(self):
        self.assertEqual(ATSBenchmarkRunner.calculate_percentile([], 50), 0.0)
        data = [1.0, 2.0, 3.0, 4.0, 5.0]
        p50 = ATSBenchmarkRunner.calculate_percentile(data, 50)
        self.assertEqual(p50, 3.0)
        p95 = ATSBenchmarkRunner.calculate_percentile(data, 95)
        self.assertTrue(p95 >= 4.0)

    def test_run_benchmark_suite(self):
        report = ATSBenchmarkRunner.run_benchmark_suite()
        self.assertIsInstance(report, BenchmarkReportResponse)
        self.assertEqual(report.status, "success")
        self.assertGreater(report.dataset_size, 0)
        self.assertGreater(report.latency_metrics.resumes_per_second, 0)
        self.assertLess(report.latency_metrics.mean_seconds, 2.5)

        cm = report.classification_metrics.confusion_matrix
        total_evals = cm.true_positives + cm.false_positives + cm.true_negatives + cm.false_negatives
        self.assertEqual(total_evals, report.dataset_size)

        self.assertGreaterEqual(report.classification_metrics.accuracy, 0.0)
        self.assertLessEqual(report.classification_metrics.accuracy, 100.0)
        self.assertEqual(report.security_benchmark.defense_success_rate, 100.0)

    def test_get_latest_report_caching(self):
        rep1 = ATSBenchmarkRunner.get_latest_report()
        self.assertIsNotNone(rep1)
        rep2 = ATSBenchmarkRunner.get_latest_report()
        self.assertIsNotNone(rep2)
        self.assertEqual(rep1.dataset_size, rep2.dataset_size)

if __name__ == "__main__":
    unittest.main()
