// Passive staging probes. No credentials, mutations, or restart actions.
const origin = 'https://usi-design-thinking-api-staging.onrender.com';
let failed = false;
for (const path of ['/health', '/health/ready']) {
  const samples = [];
  for (let index = 0; index < 5; index += 1) {
    const started = performance.now();
    try {
      const response = await fetch(origin + path, { signal: AbortSignal.timeout(10000), cache: 'no-store' });
      await response.arrayBuffer();
      samples.push({ status: response.status, milliseconds: Math.round(performance.now() - started) });
      if (response.status !== 200) failed = true;
    } catch {
      samples.push({ status: 'unreachable', milliseconds: Math.round(performance.now() - started) });
      failed = true;
      break;
    }
  }
  const durations = samples.filter((sample) => sample.status === 200).map((sample) => sample.milliseconds).sort((a, b) => a - b);
  console.log(JSON.stringify({ path, samples, medianMs: durations.length ? durations[Math.floor(durations.length / 2)] : null, p95Ms: durations.length ? durations[Math.ceil(durations.length * 0.95) - 1] : null }));
}
process.exitCode = failed ? 1 : 0;
