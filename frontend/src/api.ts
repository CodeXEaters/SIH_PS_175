export interface ApiJob {
  job_id: string;
  status: string;
  input_file: string;
  created_at: string;
  updated_at: string;
  results?: Record<string, unknown>;
  error?: { code: string; message: string } | null;
}

const apiBase = (
  import.meta.env.VITE_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, init);
  const body = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(body?.message || `API request failed (${response.status})`);
  return body as T;
}

export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return /^https?:\/\//.test(path) ? path : `${apiBase}${path}`;
}

export async function uploadImage(file: File): Promise<ApiJob> {
  const form = new FormData();
  form.append("file", file);
  return request<ApiJob>("/inference", { method: "POST", body: form });
}

export function getJob(jobId: string): Promise<ApiJob> {
  return request<ApiJob>(`/inference/${encodeURIComponent(jobId)}`);
}

export function getDsmMetadata(
  jobId: string,
): Promise<Record<string, unknown>> {
  return request<{ metadata: Record<string, unknown> }>(
    `/dsm/${encodeURIComponent(jobId)}/metadata`,
  ).then((result) => result.metadata);
}

export function getVisualization(
  jobId: string,
): Promise<{
  assets: Record<string, string | null>;
  metadata: Record<string, unknown> | null;
}> {
  return request(`/visualization/${encodeURIComponent(jobId)}`);
}

export async function waitForJob(
  jobId: string,
  onUpdate: (job: ApiJob) => void,
): Promise<ApiJob> {
  for (;;) {
    const job = await getJob(jobId);
    onUpdate(job);
    if (job.status === "COMPLETED" || job.status === "FAILED") return job;
    await new Promise((resolve) => window.setTimeout(resolve, 500));
  }
}
