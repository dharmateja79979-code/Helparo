import { FormEvent, useEffect, useMemo, useState } from "react";
import { callApi } from "./lib/api";
import { supabase } from "./lib/supabase";
import type { AdminUser } from "./types";

type Tab =
  | "overview"
  | "moderation"
  | "disputes"
  | "escrow"
  | "catalog"
  | "zones"
  | "plans"
  | "audit";

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "moderation", label: "Helper Moderation" },
  { id: "disputes", label: "Disputes" },
  { id: "escrow", label: "Escrow" },
  { id: "catalog", label: "Categories" },
  { id: "zones", label: "Zones" },
  { id: "plans", label: "Plans" },
  { id: "audit", label: "Audit Logs" }
];

export const App = () => {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

  const [commission, setCommission] = useState<number>(15);
  const [helperId, setHelperId] = useState("");
  const [helperReason, setHelperReason] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [escrowAction, setEscrowAction] = useState("hold");
  const [escrowNote, setEscrowNote] = useState("");
  const [disputes, setDisputes] = useState<Array<Record<string, unknown>>>([]);
  const [auditLogs, setAuditLogs] = useState<Array<Record<string, unknown>>>([]);
  const [categories, setCategories] = useState<Array<Record<string, unknown>>>([]);
  const [zones, setZones] = useState<Array<Record<string, unknown>>>([]);
  const [plans, setPlans] = useState<Array<Record<string, unknown>>>([]);

  const [createCategoryName, setCreateCategoryName] = useState("");
  const [createZoneName, setCreateZoneName] = useState("");
  const [createZoneCity, setCreateZoneCity] = useState("Bangalore");
  const [createPlanCode, setCreatePlanCode] = useState("");
  const [createPlanName, setCreatePlanName] = useState("");
  const [createPlanPrice, setCreatePlanPrice] = useState("299");
  const [createPlanFeatures, setCreatePlanFeatures] = useState("priority_matching");

  const canUseAdmin = useMemo(() => Boolean(sessionToken && admin?.role === "admin"), [sessionToken, admin]);

  const refreshAll = async (token: string) => {
    const [commissionRow, disputeRows, auditRows, catRows, zoneRows, planRows] = await Promise.all([
      callApi<Record<string, unknown> | null>("/admin/config/commission", token),
      callApi<Array<Record<string, unknown>>>("/admin/disputes", token),
      callApi<Array<Record<string, unknown>>>("/admin/audit-logs", token),
      callApi<Array<Record<string, unknown>>>("/admin/categories", token),
      callApi<Array<Record<string, unknown>>>("/admin/zones", token),
      callApi<Array<Record<string, unknown>>>("/admin/subscription-plans", token)
    ]);

    const percent = Number(
      ((commissionRow?.value as Record<string, unknown> | undefined)?.default_percent ?? 15) as number
    );
    setCommission(percent);
    setDisputes(disputeRows);
    setAuditLogs(auditRows);
    setCategories(catRows);
    setZones(zoneRows);
    setPlans(planRows);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token ?? null;
        setSessionToken(token);
        if (!token) return;
        const me = await callApi<AdminUser>("/auth/me", token);
        if (me.role !== "admin") {
          setError("Access denied. Only admin users are allowed.");
          await supabase.auth.signOut();
          setSessionToken(null);
          return;
        }
        setAdmin(me);
        await refreshAll(token);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to bootstrap admin panel");
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      if (authError) throw authError;
      const token = data.session?.access_token;
      if (!token) throw new Error("Missing session token");
      const me = await callApi<AdminUser>("/auth/me", token);
      if (me.role !== "admin") {
        throw new Error("This user is not an admin");
      }
      setSessionToken(token);
      setAdmin(me);
      await refreshAll(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSessionToken(null);
    setAdmin(null);
  };

  const safeAction = async (action: () => Promise<void>) => {
    if (!sessionToken) return;
    try {
      setError(null);
      await action();
      await refreshAll(sessionToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    }
  };

  if (loading) {
    return <div className="center">Loading admin console...</div>;
  }

  if (!canUseAdmin) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <h1>Helparo Admin</h1>
          <p className="muted">Sign in with a Supabase admin account.</p>
          <form onSubmit={login} className="stack">
            <label>
              Email
              <input value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <button type="submit">Sign In</button>
          </form>
          {error ? <p className="error">{error}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Helparo Admin</h2>
        <p className="muted">{admin?.email ?? admin?.id}</p>
        {tabs.map((t) => (
          <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
        <button onClick={logout}>Logout</button>
      </aside>
      <main className="content">
        {error ? <div className="banner">{error}</div> : null}

        {tab === "overview" ? (
          <section className="grid">
            <Card title="Disputes">{String(disputes.length)}</Card>
            <Card title="Categories">{String(categories.length)}</Card>
            <Card title="Zones">{String(zones.length)}</Card>
            <Card title="Plans">{String(plans.length)}</Card>
          </section>
        ) : null}

        {tab === "moderation" ? (
          <section className="panel">
            <h3>Helper Moderation</h3>
            <input placeholder="Helper user id" value={helperId} onChange={(e) => setHelperId(e.target.value)} />
            <input placeholder="Reason" value={helperReason} onChange={(e) => setHelperReason(e.target.value)} />
            <div className="row">
              <button onClick={() => safeAction(() => callApi(`/admin/helpers/${helperId}/approve`, sessionToken!, { method: "POST", body: JSON.stringify({ reason: helperReason }) }).then(() => Promise.resolve()))}>Approve</button>
              <button onClick={() => safeAction(() => callApi(`/admin/helpers/${helperId}/reject`, sessionToken!, { method: "POST", body: JSON.stringify({ reason: helperReason }) }).then(() => Promise.resolve()))}>Reject</button>
              <button onClick={() => safeAction(() => callApi(`/admin/helpers/${helperId}/suspend`, sessionToken!, { method: "POST", body: JSON.stringify({ reason: helperReason }) }).then(() => Promise.resolve()))}>Suspend</button>
            </div>
          </section>
        ) : null}

        {tab === "disputes" ? (
          <section className="panel">
            <h3>Disputes</h3>
            <table>
              <thead>
                <tr><th>ID</th><th>Status</th><th>Booking</th><th>Action</th></tr>
              </thead>
              <tbody>
                {disputes.slice(0, 20).map((d) => (
                  <tr key={String(d.id)}>
                    <td>{String(d.id).slice(0, 8)}</td>
                    <td>{String(d.status ?? "")}</td>
                    <td>{String(d.booking_id ?? "").slice(0, 8)}</td>
                    <td className="row">
                      <button onClick={() => safeAction(() => callApi(`/admin/disputes/${d.id}/resolve`, sessionToken!, { method: "POST", body: JSON.stringify({ status: "investigating" }) }).then(() => Promise.resolve()))}>Investigate</button>
                      <button onClick={() => safeAction(() => callApi(`/admin/disputes/${d.id}/resolve`, sessionToken!, { method: "POST", body: JSON.stringify({ status: "resolved", resolutionNote: "Resolved by admin" }) }).then(() => Promise.resolve()))}>Resolve</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {tab === "escrow" ? (
          <section className="panel">
            <h3>Escrow Actions</h3>
            <input placeholder="Payment ID" value={paymentId} onChange={(e) => setPaymentId(e.target.value)} />
            <select value={escrowAction} onChange={(e) => setEscrowAction(e.target.value)}>
              <option value="hold">Hold</option>
              <option value="release">Release</option>
              <option value="refund">Refund</option>
            </select>
            <input placeholder="Note" value={escrowNote} onChange={(e) => setEscrowNote(e.target.value)} />
            <button onClick={() => safeAction(() => callApi(`/admin/payments/${paymentId}/escrow`, sessionToken!, { method: "POST", body: JSON.stringify({ action: escrowAction, note: escrowNote }) }).then(() => Promise.resolve()))}>
              Apply Escrow Action
            </button>
          </section>
        ) : null}

        {tab === "catalog" ? (
          <section className="panel">
            <h3>Categories</h3>
            <div className="row">
              <input placeholder="New category" value={createCategoryName} onChange={(e) => setCreateCategoryName(e.target.value)} />
              <button onClick={() => safeAction(() => callApi("/admin/categories", sessionToken!, { method: "POST", body: JSON.stringify({ name: createCategoryName }) }).then(() => Promise.resolve()))}>Add</button>
            </div>
            <table>
              <tbody>
                {categories.map((c) => (
                  <tr key={String(c.id)}>
                    <td>{String(c.name)}</td>
                    <td>{String(c.is_active)}</td>
                    <td><button onClick={() => safeAction(() => callApi(`/admin/categories/${c.id}`, sessionToken!, { method: "PATCH", body: JSON.stringify({ isActive: !(c.is_active as boolean) }) }).then(() => Promise.resolve()))}>Toggle Active</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {tab === "zones" ? (
          <section className="panel">
            <h3>Zones</h3>
            <div className="row">
              <input placeholder="Zone name" value={createZoneName} onChange={(e) => setCreateZoneName(e.target.value)} />
              <input placeholder="City" value={createZoneCity} onChange={(e) => setCreateZoneCity(e.target.value)} />
              <button onClick={() => safeAction(() => callApi("/admin/zones", sessionToken!, { method: "POST", body: JSON.stringify({ name: createZoneName, city: createZoneCity, country: "India" }) }).then(() => Promise.resolve()))}>Add</button>
            </div>
            <table>
              <tbody>
                {zones.map((z) => (
                  <tr key={String(z.id)}>
                    <td>{String(z.name)}</td>
                    <td>{String(z.city)}</td>
                    <td>{String(z.is_active)}</td>
                    <td><button onClick={() => safeAction(() => callApi(`/admin/zones/${z.id}`, sessionToken!, { method: "PATCH", body: JSON.stringify({ isActive: !(z.is_active as boolean) }) }).then(() => Promise.resolve()))}>Toggle</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {tab === "plans" ? (
          <section className="panel">
            <h3>Subscription Plans</h3>
            <div className="row">
              <input placeholder="Code" value={createPlanCode} onChange={(e) => setCreatePlanCode(e.target.value)} />
              <input placeholder="Name" value={createPlanName} onChange={(e) => setCreatePlanName(e.target.value)} />
              <input placeholder="Price" value={createPlanPrice} onChange={(e) => setCreatePlanPrice(e.target.value)} />
              <input placeholder="Features comma-separated" value={createPlanFeatures} onChange={(e) => setCreatePlanFeatures(e.target.value)} />
              <button onClick={() => safeAction(() => callApi("/admin/subscription-plans", sessionToken!, { method: "POST", body: JSON.stringify({ code: createPlanCode, name: createPlanName, monthlyPrice: Number(createPlanPrice), features: createPlanFeatures.split(",").map((f) => f.trim()).filter(Boolean) }) }).then(() => Promise.resolve()))}>Add</button>
            </div>
            <table>
              <tbody>
                {plans.map((p) => (
                  <tr key={String(p.id)}>
                    <td>{String(p.code)}</td>
                    <td>{String(p.name)}</td>
                    <td>{String(p.monthly_price)}</td>
                    <td>{String(p.is_active)}</td>
                    <td><button onClick={() => safeAction(() => callApi(`/admin/subscription-plans/${p.id}`, sessionToken!, { method: "PATCH", body: JSON.stringify({ isActive: !(p.is_active as boolean) }) }).then(() => Promise.resolve()))}>Toggle</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {tab === "audit" ? (
          <section className="panel">
            <h3>Audit Logs</h3>
            <table>
              <thead>
                <tr><th>When</th><th>Action</th><th>Entity</th><th>Actor</th></tr>
              </thead>
              <tbody>
                {auditLogs.slice(0, 100).map((l) => (
                  <tr key={String(l.id)}>
                    <td>{String(l.created_at ?? "").replace("T", " ").slice(0, 19)}</td>
                    <td>{String(l.action ?? "")}</td>
                    <td>{String(l.entity_type ?? "")}:{String(l.entity_id ?? "").slice(0, 8)}</td>
                    <td>{String(l.actor_id ?? "").slice(0, 8)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        <section className="panel">
          <h3>Commission Config</h3>
          <div className="row">
            <input
              type="number"
              min={0}
              max={100}
              value={commission}
              onChange={(e) => setCommission(Number(e.target.value))}
            />
            <button onClick={() => safeAction(() => callApi("/admin/config/commission", sessionToken!, { method: "POST", body: JSON.stringify({ defaultPercent: commission }) }).then(() => Promise.resolve()))}>Update Commission</button>
          </div>
        </section>
      </main>
    </div>
  );
};

const Card = ({ title, children }: { title: string; children: string }) => (
  <div className="card">
    <div className="card-title">{title}</div>
    <div className="card-value">{children}</div>
  </div>
);
