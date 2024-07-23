import time

from dagster import op
from dagster._utils.test import wrap_op_in_graph_and_execute
from dagster_prometheus import PrometheusResource
from prometheus_client import Counter, Enum, Gauge, Histogram, Info, Summary

EPS = 0.001
ENV = {}
RESOURCES = {"prometheus": PrometheusResource(gateway="localhost:9091")}


def test_prometheus_counter():
    @op(required_resource_keys={"prometheus"})
    def prometheus_op(context):
        c = Counter(
            "some_counter_seconds",
            "Description of this counter",
            registry=context.resources.prometheus.registry,
        )
        c.inc()
        c.inc(1.6)
        recorded = context.resources.prometheus.registry.get_sample_value(
            "some_counter_seconds_total"
        )
        assert abs(2.6 - recorded) < EPS

    assert wrap_op_in_graph_and_execute(prometheus_op, run_config=ENV, resources=RESOURCES).success


def test_prometheus_counter_pythonic_res() -> None:
    @op
    def prometheus_op(prometheus: PrometheusResource) -> None:
        c = Counter(
            "some_counter_seconds",
            "Description of this counter",
            registry=prometheus.registry,
        )
        c.inc()
        c.inc(1.6)
        recorded = prometheus.registry.get_sample_value("some_counter_seconds_total")
        assert recorded
        assert abs(2.6 - recorded) < EPS

    assert wrap_op_in_graph_and_execute(prometheus_op, run_config=ENV, resources=RESOURCES).success


def test_prometheus_gauge():
    @op(required_resource_keys={"prometheus"})
    def prometheus_op(context):
        g = Gauge(
            "job_last_success_unixtime",
            "Last time a batch job successfully finished",
            registry=context.resources.prometheus.registry,
        )
        g.set_to_current_time()
        recorded = context.resources.prometheus.registry.get_sample_value(
            "job_last_success_unixtime"
        )
        assert abs(time.time() - recorded) < 10.0

    assert wrap_op_in_graph_and_execute(prometheus_op, run_config=ENV, resources=RESOURCES).success


def test_prometheus_summary():
    @op(required_resource_keys={"prometheus"})
    def prometheus_op(context):
        s = Summary(
            "request_latency_seconds",
            "Description of summary",
            registry=context.resources.prometheus.registry,
        )
        s.observe(4.7)
        request_time = Summary(
            "response_latency_seconds",
            "Response latency (seconds)",
            registry=context.resources.prometheus.registry,
        )

        with request_time.time():
            time.sleep(1)

        recorded = context.resources.prometheus.registry.get_sample_value(
            "request_latency_seconds_sum"
        )
        assert abs(4.7 - recorded) < EPS

        recorded = context.resources.prometheus.registry.get_sample_value(
            "response_latency_seconds_sum"
        )
        assert abs(1.0 - recorded) < 1.0

    assert wrap_op_in_graph_and_execute(prometheus_op, run_config=ENV, resources=RESOURCES).success


def test_prometheus_histogram():
    @op(required_resource_keys={"prometheus"})
    def prometheus_op(context):
        h = Histogram(
            "job_runtime_seconds",
            "Description of histogram",
            registry=context.resources.prometheus.registry,
        )
        h.observe(4.7)
        recorded = context.resources.prometheus.registry.get_sample_value("job_runtime_seconds_sum")
        assert abs(4.7 - recorded) < EPS

    assert wrap_op_in_graph_and_execute(prometheus_op, run_config=ENV, resources=RESOURCES).success


def test_prometheus_info():
    @op(required_resource_keys={"prometheus"})
    def prometheus_op(context):
        i = Info(
            "my_build_version",
            "Description of info",
            registry=context.resources.prometheus.registry,
        )
        info_labels = {"version": "1.2.3", "buildhost": "foo@bar"}
        i.info(info_labels)
        metric = None
        for metric in context.resources.prometheus.registry.collect():
            if metric.name == "my_build_version":
                break
        assert metric and metric.samples[0].labels == info_labels

    assert wrap_op_in_graph_and_execute(prometheus_op, run_config=ENV, resources=RESOURCES).success


def test_prometheus_enum():
    @op(required_resource_keys={"prometheus"})
    def prometheus_op(context):
        e = Enum(
            "my_task_state",
            "Description of enum",
            states=["starting", "running", "stopped"],
            registry=context.resources.prometheus.registry,
        )
        # no idea why pylint doesn't like this line, it's correct
        e.state("running")

        metric = None
        for metric in context.resources.prometheus.registry.collect():
            if metric.name == "my_task_state":
                break
        assert metric and metric.samples[0].labels == {"my_task_state": "starting"}

    assert wrap_op_in_graph_and_execute(prometheus_op, run_config=ENV, resources=RESOURCES).success
