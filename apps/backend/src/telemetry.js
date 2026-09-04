const { NodeSDK } = require("@opentelemetry/sdk-node");
const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");
const {
  ExpressInstrumentation,
} = require("@opentelemetry/instrumentation-express");
const { PrometheusExporter } = require("@opentelemetry/exporter-prometheus");
const { JaegerExporter } = require("@opentelemetry/exporter-jaeger");

const initTelemetry = () => {
  try {
    const sdk = new NodeSDK({
      traceExporter: new JaegerExporter({
        endpoint:
          process.env.JAEGER_ENDPOINT || "http://jaeger:14268/api/traces",
      }),
      metricReader: new PrometheusExporter({ port: 9464 }),
      instrumentations: [
        new HttpInstrumentation(),
        new ExpressInstrumentation(),
      ],
    });

    sdk.start();
    console.log("OpenTelemetry initialized");
  } catch (err) {
    console.warn("Telemetry initialization skipped:", err.message);
  }
};

module.exports = {
  initTelemetry,
};
