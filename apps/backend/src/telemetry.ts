import { NodeSDK } from "@opentelemetry/sdk-node";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { JaegerExporter } from "@opentelemetry/exporter-jaeger";
import { registerInstrumentations } from "@opentelemetry/instrumentation";

export const initTelemetry = () => {
  const sdk = new NodeSDK({
    // resource: new Resource({ [SemanticResourceAttributes.SERVICE_NAME]: 'flowctrl-backend' }),

    traceExporter: new JaegerExporter({
      endpoint: process.env.JAEGER_ENDPOINT || "http://jaeger:14268/api/traces",
    }),
    metricReader: new PrometheusExporter({ port: 9464 }),
    instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()],
  });

  sdk.start();
  console.log("OpenTelemetry initialized");
};
