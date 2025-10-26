export type DBProvider = "POSTGRES" | "MONGO"

export interface ParsedConnection {
  provider: DBProvider
  host: string
  port?: string
  username: string
  password: string
  database: string
  options?: string
  sslmode?: string
}

export function buildConnectionUri(conn: ParsedConnection & { isSrv?: boolean }): string {
  if (conn.provider === "POSTGRES") {
    const port = conn.port || "5432"
    const sslmode = conn.sslmode || "require"
    return `postgresql://${encodeURIComponent(conn.username)}:${encodeURIComponent(conn.password)}@${conn.host}:${port}/${conn.database}?sslmode=${sslmode}`
  } else if (conn.provider === "MONGO") {
    const protocol = conn.isSrv ? "mongodb+srv" : "mongodb"
    const portPart = !conn.isSrv && conn.port ? `:${conn.port}` : ""
    const options = conn.options ? `?${conn.options}` : ""
    return `${protocol}://${encodeURIComponent(conn.username)}:${encodeURIComponent(conn.password)}@${conn.host}${portPart}/${conn.database}${options}`
  }
  throw new Error("Unsupported DB provider")
}

export function parseConnectionUri(uri: string): ParsedConnection & { isSrv?: boolean } {
  if (uri.startsWith("postgresql://")) {
    const match = uri.match(
      /^postgresql:\/\/([^:]+):([^@]+)@([^:/]+)(?::(\d+))?\/([^?]+)(\?.*)?$/
    )
    if (!match) throw new Error("Invalid Postgres URI")
    const [, username, password, host, port, database, options] = match
    return {
      provider: "POSTGRES",
      host,
      port,
      username: decodeURIComponent(username),
      password: decodeURIComponent(password),
      database,
      options: options ? options.slice(1) : undefined,
    }
  } else if (uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://")) {
    const isSrv = uri.startsWith("mongodb+srv://")
    const match = uri.match(
      /^mongodb(\+srv)?:\/\/([^:]+):([^@]+)@([^/]+)\/?([^?]*)?(\?.*)?$/
    )
    if (!match) throw new Error("Invalid Mongo URI")
    const [, , username, password, host, database, options] = match
    return {
      provider: "MONGO",
      host,
      username: decodeURIComponent(username),
      password: decodeURIComponent(password),
      database: database || "", // SRV URI may omit DB
      options: options ? options.slice(1) : undefined,
      isSrv,
    }
  }
  throw new Error("Unsupported URI")
}