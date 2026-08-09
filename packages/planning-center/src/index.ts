export interface PlanningCenterClientOptions {
  appId: string;
  secret: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export interface PlanningCenterResource<TAttributes extends Record<string, unknown>> {
  type: string;
  id: string;
  attributes: TAttributes;
}

export interface PlanningCenterCollection<TResource = unknown> {
  data: TResource[];
  included?: unknown[];
  links?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export class PlanningCenterClient {
  private readonly baseUrl: string;
  private readonly authorization: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: PlanningCenterClientOptions) {
    this.baseUrl = options.baseUrl ?? "https://api.planningcenteronline.com";
    this.authorization = `Basic ${Buffer.from(`${options.appId}:${options.secret}`).toString("base64")}`;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async get<T>(path: string, query: Record<string, string> = {}): Promise<T> {
    const url = new URL(path, this.baseUrl);
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);

    const response = await this.fetchImpl(url, {
      headers: { Authorization: this.authorization, Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`Planning Center request failed: ${response.status}`);
    return (await response.json()) as T;
  }

  async getCheckIn(checkInId: string) {
    return this.get(`/check-ins/v2/check_ins/${encodeURIComponent(checkInId)}`);
  }
}
