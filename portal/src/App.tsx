import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Copy,
  ExternalLink,
  GitPullRequest,
  Globe2,
  Home,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Play,
  Server,
  ShieldCheck,
  UploadCloud,
  X,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { hackathonRules, tasks, type CredentialField, type Task } from './data/tasks';

type BootstrapCredential = {
  value: string;
  configured: boolean;
  secret: boolean;
};

type Bootstrap = {
  team: {
    id: string;
    name: string;
    publicUrl: string;
    ipPublicUrl: string;
    domainPublicUrl: string;
    publicUrlMode: string;
  };
  repository: {
    owner: string;
    name: string;
    tokenConfigured: boolean;
  };
  dnsPortal: {
    zone: string;
    teamLabel: string;
    suffix: string;
    assignedDomain: string;
    publicUrl: string;
    ttl: number;
    tokenConfigured: boolean;
    txtValue: string;
    teamPasswordConfigured: boolean;
    portalUrl: string;
  };
  credentials: Record<string, BootstrapCredential>;
  secretDisplayEnabled: boolean;
  scoring: {
    total: number;
    automated: number;
    judge: number;
  };
};

type CheckItem = {
  status: 'pass' | 'fail' | 'manual_review';
  label: string;
  detail: string;
};

type CheckRun = {
  id: string;
  taskId: string;
  status: 'running' | 'passed' | 'failed' | 'manual_review';
  progress: number;
  message: string;
  items: CheckItem[];
  createdAt: string;
  updatedAt: string;
  finishedAt?: string;
};

type DnsExpectedRecord = {
  label: string;
  name: string;
  fqdn: string;
  type: string;
  value: string;
  found?: boolean;
  values?: string[];
  matches?: boolean;
};

type DnsAutomationItem = {
  status: CheckItem['status'];
  label: string;
  detail: string;
};

const statusLabel: Record<CheckRun['status'], string> = {
  running: 'Checking',
  passed: 'Passed',
  failed: 'Failed',
  manual_review: 'Manual review',
};

function StatusIcon({ status }: { status: CheckRun['status'] | CheckItem['status'] }) {
  if (status === 'passed' || status === 'pass') {
    return <CheckCircle2 size={18} />;
  }
  if (status === 'failed' || status === 'fail') {
    return <XCircle size={18} />;
  }
  if (status === 'running') {
    return <LoaderCircle className="spin" size={18} />;
  }
  return <AlertTriangle size={18} />;
}

function latestRunByTask(runs: CheckRun[]) {
  const sorted = [...runs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const latest = new Map<string, CheckRun>();
  for (const run of sorted) {
    if (!latest.has(run.taskId)) {
      latest.set(run.taskId, run);
    }
  }
  return latest;
}

function orderedCheckItems(items: CheckItem[]) {
  const priority: Record<CheckItem['status'], number> = {
    fail: 0,
    manual_review: 1,
    pass: 2,
  };
  return [...items].sort((a, b) => priority[a.status] - priority[b.status]);
}

const checkGroupOrder = [
  'Human Workflow Gate',
  'Task Implementation Checks',
  'Security / AI Marker / Secret Hygiene',
  'Live / Artifact / Service Evidence',
] as const;

type CheckGroupName = (typeof checkGroupOrder)[number];

function checkCategory(item: CheckItem): CheckGroupName {
  const text = `${item.label} ${item.detail}`;
  if (/Task PR|Human PR author|Fresh collaborator approval|Human merge actor|Bot\/agent actor scan|Collaborator metadata/i.test(text)) {
    return 'Human Workflow Gate';
  }
  if (/secret|AI marker|agent marker|raw|leak|exposure|unsafe|pull_request_target|client secret|committed env|browser secret|conflict markers/i.test(text)) {
    return 'Security / AI Marker / Secret Hygiene';
  }
  if (/live|health|status|DNS|domain|artifact|manifest|run|Actions|deploy evidence|weather|contact provider|Sentry release/i.test(text)) {
    return 'Live / Artifact / Service Evidence';
  }
  return 'Task Implementation Checks';
}

function groupedCheckItems(items: CheckItem[]) {
  const groups = new Map<CheckGroupName, CheckItem[]>();
  for (const title of checkGroupOrder) {
    groups.set(title, []);
  }
  for (const item of orderedCheckItems(items)) {
    groups.get(checkCategory(item))?.push(item);
  }
  return checkGroupOrder
    .map((title) => ({ title, items: groups.get(title) || [] }))
    .filter((group) => group.items.length > 0);
}

function runProgressLabel(run: CheckRun) {
  return run.status === 'running' ? `${run.progress}%` : 'Complete';
}

function scoreFromRuns(runs: CheckRun[]) {
  const latest = latestRunByTask(runs);
  return tasks.reduce(
    (score, task) => {
      const run = latest.get(task.id);
      if (run?.status === 'passed') {
        score.automated += task.automatedPoints;
      }
      return score;
    },
    { automated: 0 },
  );
}

function credentialDisplay(field: CredentialField, bootstrap?: Bootstrap) {
  const credential = bootstrap?.credentials[field.key];
  if (!credential) {
    return {
      value: `<${field.key}>`,
      configured: false,
      secret: field.secret ?? false,
    };
  }
  return credential;
}

function EvidenceList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="taskSection">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function CredentialPack({ task, bootstrap }: { task: Task; bootstrap?: Bootstrap }) {
  if (!task.organizerProvides.length && !task.requiredSecrets.length) {
    return null;
  }

  return (
    <section className="taskSection">
      <div className="sectionTitleRow">
        <h3>Credential Pack</h3>
        <LockKeyhole size={18} />
      </div>

      {task.organizerProvides.length ? (
        <div className="credentialGrid">
          {task.organizerProvides.map((field) => {
            const credential = credentialDisplay(field, bootstrap);
            return (
              <div className="credentialItem" key={field.key}>
                <span>{field.label}</span>
                <code>{credential.value}</code>
                <small>{credential.configured ? 'Configured on server' : 'Placeholder'}</small>
              </div>
            );
          })}
        </div>
      ) : null}

      {task.requiredSecrets.length ? (
        <div className="secretList" aria-label="Required GitHub Secrets">
          {task.requiredSecrets.map((secret) => (
            <span key={secret}>
              <KeyRound size={14} />
              {secret}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function SnippetPackPanel({ task }: { task: Task }) {
  const pack = task.snippetPack;
  if (!pack) {
    return null;
  }

  async function copySnippet(content: string) {
    await navigator.clipboard.writeText(content);
  }

  return (
    <section className="taskSection snippetSection">
      <div className="sectionTitleRow">
        <div>
          <h3>{pack.title}</h3>
          <p>{pack.description}</p>
        </div>
        <ClipboardList size={18} />
      </div>

      <div className="snippetList">
        {pack.snippets.map((snippet) => (
          <article className="snippetCard" key={snippet.label}>
            <div className="snippetHeader">
              <span>{snippet.label}</span>
              <button className="secondaryButton compact" type="button" onClick={() => copySnippet(snippet.content)}>
                <Copy size={15} />
                Copy
              </button>
            </div>
            <pre>
              <code>{snippet.content}</code>
            </pre>
          </article>
        ))}
      </div>

      <div className="markerGrid">
        <div>
          <strong>Required evidence</strong>
          <span>{pack.requiredMarkers.join(', ')}</span>
        </div>
        <div>
          <strong>Forbidden leftovers</strong>
          <span>{pack.forbiddenMarkers.join(', ')}</span>
        </div>
      </div>
    </section>
  );
}

function CheckItemGroups({ items, runId }: { items: CheckItem[]; runId: string }) {
  const groups = groupedCheckItems(items);
  if (!groups.length) {
    return null;
  }

  return (
    <div className="checkGroups">
      {groups.map((group) => (
        <section className="checkGroup" key={`${runId}-${group.title}`}>
          <h4>{group.title}</h4>
          <ul className="runItems">
            {group.items.map((item, index) => (
              <li key={`${runId}-${group.title}-${index}-${item.label}`}>
                <StatusIcon status={item.status} />
                <span>
                  <strong>{item.label}</strong>
                  {item.detail}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function RunPanel({ run }: { run?: CheckRun }) {
  if (!run) {
    return (
      <div className="runPanel idle">
        <ClipboardList size={18} />
        <span>No check run yet</span>
      </div>
    );
  }

  return (
    <div className={`runPanel ${run.status}`}>
      <div className="runHeader">
        <span>
          <StatusIcon status={run.status} />
          {statusLabel[run.status]}
        </span>
        <strong>{runProgressLabel(run)}</strong>
      </div>
      <div className="progressTrack" aria-label="Check progress">
        <div style={{ width: `${run.progress}%` }} />
      </div>
      <p>{run.message}</p>
      <CheckItemGroups items={run.items} runId={run.id} />
    </div>
  );
}

function TaskPage({
  task,
  taskIndex,
  totalTasks,
  bootstrap,
  run,
  checking,
  onBack,
  onNext,
  onCheck,
}: {
  task: Task;
  taskIndex: number;
  totalTasks: number;
  bootstrap?: Bootstrap;
  run?: CheckRun;
  checking: boolean;
  onBack: () => void;
  onNext: () => void;
  onCheck: () => void;
}) {
  return (
    <article className="taskPage">
      <div className="taskHero">
        <div>
          <p className="eyebrow">
            {task.id} · Release {task.release}
          </p>
          <h1>{task.title}</h1>
          <p>{task.summary}</p>
        </div>
        <div className="scoreCard">
          <span>{task.level}</span>
          <strong>{task.points}</strong>
          <small>
            {task.automatedPoints} auto + {task.judgePoints} judge
          </small>
        </div>
      </div>

      <div className="taskToolbar">
        <button className="secondaryButton" onClick={onBack}>
          <ChevronLeft size={18} />
          Previous
        </button>
        <span>
          Task {taskIndex + 1} of {totalTasks}
        </span>
        <button className="secondaryButton" onClick={onNext}>
          Next
          <ChevronRight size={18} />
        </button>
      </div>

      <RunPanel run={run} />

      <section className="taskSection">
        <h3>Expected Work</h3>
        <dl className="metaGrid">
          <div>
            <dt>Branch</dt>
            <dd>
              <code>{task.expectedBranch}</code>
            </dd>
          </div>
          <div>
            <dt>PR Title</dt>
            <dd>
              <code>{task.expectedPrTitle}</code>
            </dd>
          </div>
          <div>
            <dt>Repository</dt>
            <dd>
              <code>
                {bootstrap?.repository.owner || 'knurdz'}/{bootstrap?.repository.name || 'deploy-sprint-finale-test-team-01-zero'}
              </code>
            </dd>
          </div>
        </dl>
      </section>

      <CredentialPack task={task} bootstrap={bootstrap} />

      <EvidenceList title="Human Workflow Proof" items={task.interactionProof} />
      <SnippetPackPanel task={task} />
      {task.debugChallenge?.length ? <EvidenceList title="Operational Validation" items={task.debugChallenge} /> : null}
      <EvidenceList title="Participant Steps" items={task.setupSteps} />
      <EvidenceList title="Deliverables" items={task.deliverables} />
      <EvidenceList title="Acceptance Evidence" items={task.acceptanceEvidence} />
      <EvidenceList title="Fallback Evidence" items={task.fallbackEvidence} />
      <EvidenceList title="Automated Check Criteria" items={task.checkCriteria} />

      <div className="checkDock">
        <div>
          <strong>{task.id} automated check</strong>
          <span>The evaluator inspects GitHub, workflows, source hygiene, artifacts, DNS, and live evidence where relevant.</span>
        </div>
        <button className="primaryButton" disabled={checking} onClick={onCheck}>
          {checking ? <LoaderCircle className="spin" size={18} /> : <Play size={18} />}
          {checking ? 'Checking' : 'Check Task'}
        </button>
      </div>
    </article>
  );
}

function HomePage({ bootstrap, onStart }: { bootstrap?: Bootstrap; onStart: () => void }) {
  return (
    <section className="homePage">
      <div className="homeHero">
        <div>
          <p className="eyebrow">Deploy Sprint Finale</p>
          <h1>Participant Control Room</h1>
          <p>
            Six hours, one private repository, one assigned VPS, and a sequence of independent tasks covering Git,
            GitHub, Actions, secrets, Docker, DNS, OAuth, deployment safety, and recovery.
          </p>
        </div>
        <div className="homeSignal">
          <Server size={30} />
          <strong>{bootstrap?.team.name || 'Test Team 01'}</strong>
          <span>Active: {bootstrap?.team.publicUrl || 'Public URL pending'}</span>
          <small>IP: {bootstrap?.team.ipPublicUrl || 'pending'}</small>
          <small>Domain: {bootstrap?.team.domainPublicUrl || 'pending'}</small>
        </div>
      </div>

      <section className="rulesGrid">
        <div className="rulesPanel">
          <h2>Hackathon Rules</h2>
          <ul>
            {hackathonRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
        <div className="rulesPanel compact">
          <h2>Scoring</h2>
          <div className="scoreRows">
            <span>Total</span>
            <strong>{bootstrap?.scoring.total || 1000}</strong>
            <span>Automated</span>
            <strong>{bootstrap?.scoring.automated || 800}</strong>
            <span>Judges</span>
            <strong>{bootstrap?.scoring.judge || 200}</strong>
          </div>
          <p>
            Automated marks come from evidence. Judge marks come from explanation, ownership, review quality, and safe
            handling of risk.
          </p>
        </div>
      </section>

      <button className="primaryButton startButton" onClick={onStart}>
        Start Task One
        <ChevronRight size={18} />
      </button>
    </section>
  );
}

function NotificationDrawer({
  open,
  runs,
  onClose,
}: {
  open: boolean;
  runs: CheckRun[];
  onClose: () => void;
}) {
  return (
    <aside className={`notificationDrawer ${open ? 'open' : ''}`} aria-label="Evaluator notifications">
      <div className="drawerHeader">
        <div>
          <p className="eyebrow">Evaluator</p>
          <h2>Check Runs</h2>
        </div>
        <button className="iconButton light" onClick={onClose} aria-label="Close notifications">
          <X size={18} />
        </button>
      </div>

      <div className="drawerList">
        {runs.length ? (
          runs.map((run) => (
            <div className={`drawerRun ${run.status}`} key={run.id}>
              <div className="drawerRunTop">
                <span>
                  <StatusIcon status={run.status} />
                  {run.taskId}
                </span>
                <strong>{runProgressLabel(run)}</strong>
              </div>
              <div className="progressTrack small">
                <div style={{ width: `${run.progress}%` }} />
              </div>
              <p>{run.message}</p>
              <CheckItemGroups items={run.items} runId={run.id} />
            </div>
          ))
        ) : (
          <div className="emptyDrawer">
            <Bell size={22} />
            <p>No evaluator runs yet.</p>
          </div>
        )}
      </div>
    </aside>
  );
}

function DnsPortalPage() {
  const [bootstrap, setBootstrap] = useState<Bootstrap>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [records, setRecords] = useState<DnsExpectedRecord[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadBootstrap() {
    const response = await fetch('/api/bootstrap');
    if (!response.ok) {
      throw new Error(`Bootstrap failed with HTTP ${response.status}`);
    }
    const payload: Bootstrap = await response.json();
    setBootstrap(payload);
    setUsername(payload.dnsPortal.teamLabel);
  }

  async function dnsRequest(path: string, options: RequestInit = {}) {
    const response = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        ...(options.headers || {}),
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || `Request failed with HTTP ${response.status}`);
    }
    return payload;
  }

  async function login(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const payload = await dnsRequest('/api/dns-portal/session', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setSessionToken(payload.token);
      const configResponse = await fetch('/api/dns-portal/config', {
        headers: { Authorization: `Bearer ${payload.token}` },
      });
      const configPayload = await configResponse.json().catch(() => ({}));
      if (configResponse.ok) {
        setRecords(configPayload.expectedRecords || []);
      }
      setMessage('Logged in. DNS record pack unlocked.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Login failed.');
    } finally {
      setBusy(false);
    }
  }

  async function loadRecords() {
    setBusy(true);
    setMessage('');
    try {
      const payload = await dnsRequest('/api/dns-portal/records');
      setRecords(payload.expectedRecords || []);
      setMessage('Fetched Hostinger DNS records.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not fetch records.');
    } finally {
      setBusy(false);
    }
  }

  async function validateRecords() {
    setBusy(true);
    setMessage('');
    try {
      await dnsRequest('/api/dns-portal/validate', { method: 'POST', body: '{}' });
      setMessage('Hostinger accepted the DNS payload.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Validation failed.');
    } finally {
      setBusy(false);
    }
  }

  async function applyRecords() {
    setBusy(true);
    setMessage('');
    try {
      const payload = await dnsRequest('/api/dns-portal/apply', { method: 'POST', body: '{}' });
      setRecords(payload.expectedRecords || []);
      const automation = (payload.automation || []) as DnsAutomationItem[];
      const automationSummary = automation.length
        ? ` URL automation: ${automation.map((item) => `${item.label} ${item.status}`).join(', ')}.`
        : '';
      setMessage(
        `DNS records submitted to Hostinger. Effective URL: ${
          payload.effectivePublicUrl || 'domain URL pending'
        }.${automationSummary} Propagation may take time.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not apply DNS records.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadBootstrap().catch((error) => setMessage(error.message));
  }, []);

  const configRecords: DnsExpectedRecord[] = bootstrap
    ? [
        {
          label: 'Site record',
          name: bootstrap.credentials.DNS_RECORD_NAME?.value || '',
          fqdn: bootstrap.dnsPortal.assignedDomain,
          type: bootstrap.credentials.DNS_RECORD_TYPE?.value || 'A',
          value: bootstrap.credentials.DNS_RECORD_VALUE?.value || '',
        },
        {
          label: 'TXT challenge',
          name: bootstrap.credentials.DNS_TXT_NAME?.value || '',
          fqdn: `${bootstrap.credentials.DNS_TXT_NAME?.value}.${bootstrap.dnsPortal.zone}`,
          type: 'TXT',
          value: bootstrap.dnsPortal.txtValue,
        },
      ]
    : [];
  const visibleRecords = records.length ? records : configRecords;

  return (
    <main className="dnsPortalShell">
      <section className="dnsHero">
        <div>
          <p className="eyebrow">Deploy Sprint DNS Portal</p>
          <h1>Connect Your Team Domain</h1>
          <p>
            Create the assigned Hostinger DNS records for your team site. This portal stores Hostinger API access on
            the server and only exposes your team record pack.
          </p>
        </div>
        <div className="dnsSignal">
          <Globe2 size={30} />
          <strong>{bootstrap?.dnsPortal.assignedDomain || 'team01.verischolar.knurdz.org'}</strong>
          <span>{bootstrap?.dnsPortal.zone || 'knurdz.org'} zone</span>
          <small>After records are created, checks use {bootstrap?.team.domainPublicUrl || 'the assigned domain'}.</small>
        </div>
      </section>

      <section className="dnsGrid">
        <form className="dnsPanel" onSubmit={login}>
          <h2>Team Login</h2>
          <label>
            Username
            <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="team01" />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Provided by organizers"
            />
          </label>
          <button className="primaryButton" disabled={busy} type="submit">
            {busy ? <LoaderCircle className="spin" size={18} /> : <KeyRound size={18} />}
            Login
          </button>
          <p className="helperText">
            Hostinger API token configured: {bootstrap?.dnsPortal.tokenConfigured ? 'yes' : 'no'}
          </p>
        </form>

        <section className="dnsPanel wide">
          <div className="sectionTitleRow">
            <h2>Assigned Records</h2>
            <span className={sessionToken ? 'statusPill passed' : 'statusPill'}>{sessionToken ? 'Unlocked' : 'Locked'}</span>
          </div>
          <div className="dnsRecordList">
            {visibleRecords.map((record) => (
              <article className="dnsRecord" key={`${record.type}-${record.name}`}>
                <span>{record.label}</span>
                <strong>{record.type}</strong>
                <code>{record.name}</code>
                <code>{record.value}</code>
                {record.found !== undefined ? (
                  <small className={record.matches ? 'match' : 'missing'}>
                    {record.matches ? 'Matching record exists' : record.found ? 'Record exists with different value' : 'Record missing'}
                  </small>
                ) : null}
              </article>
            ))}
          </div>
          <div className="dnsActions">
            <button className="secondaryButton" disabled={!sessionToken || busy} onClick={loadRecords} type="button">
              <Globe2 size={18} />
              Refresh
            </button>
            <button className="secondaryButton" disabled={!sessionToken || busy} onClick={validateRecords} type="button">
              <ShieldCheck size={18} />
              Validate
            </button>
            <button className="primaryButton" disabled={!sessionToken || busy} onClick={applyRecords} type="button">
              {busy ? <LoaderCircle className="spin" size={18} /> : <UploadCloud size={18} />}
              Create Records
            </button>
          </div>
          {message ? <div className="dnsMessage">{message}</div> : null}
        </section>
      </section>
    </main>
  );
}

export function App() {
  if (window.location.pathname === '/dns-portal') {
    return <DnsPortalPage />;
  }

  const [bootstrap, setBootstrap] = useState<Bootstrap>();
  const [bootstrapError, setBootstrapError] = useState('');
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number | null>(null);
  const [runs, setRuns] = useState<CheckRun[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const runByTask = useMemo(() => latestRunByTask(runs), [runs]);
  const activeRuns = runs.filter((run) => run.status === 'running');
  const score = useMemo(() => scoreFromRuns(runs), [runs]);
  const currentTask = selectedTaskIndex === null ? undefined : tasks[selectedTaskIndex];

  async function loadBootstrap() {
    try {
      const response = await fetch('/api/bootstrap');
      if (!response.ok) {
        throw new Error(`Bootstrap failed with HTTP ${response.status}`);
      }
      setBootstrap(await response.json());
    } catch (error) {
      setBootstrapError(error instanceof Error ? error.message : 'Bootstrap failed.');
    }
  }

  async function refreshRuns() {
    const response = await fetch('/api/checks');
    if (response.ok) {
      setRuns(await response.json());
    }
  }

  async function startCheck(task: Task) {
    setDrawerOpen(true);
    const response = await fetch('/api/checks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: task.id }),
    });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Check failed with HTTP ${response.status}`);
    }
    const run: CheckRun = await response.json();
    setRuns((current) => [run, ...current.filter((item) => item.id !== run.id)]);
  }

  useEffect(() => {
    loadBootstrap();
    refreshRuns();
  }, []);

  useEffect(() => {
    if (!activeRuns.length) {
      return undefined;
    }
    const timer = window.setInterval(refreshRuns, 1200);
    return () => window.clearInterval(timer);
  }, [activeRuns.length]);

  const passedCount = tasks.filter((task) => runByTask.get(task.id)?.status === 'passed').length;

  return (
    <main className="portalShell">
      <aside className="taskRail">
        <div className="brand">
          <div className="brandMark">
            <ShieldCheck size={22} />
          </div>
          <div>
            <strong>Deploy Sprint</strong>
            <span>Finale Portal</span>
          </div>
        </div>

        <button className={`railHome ${selectedTaskIndex === null ? 'active' : ''}`} onClick={() => setSelectedTaskIndex(null)}>
          <Home size={18} />
          Rules
        </button>

        <div className="railStats">
          <span>{passedCount}/28 passed</span>
          <strong>{score.automated}/800 auto</strong>
        </div>

        <nav className="taskNav" aria-label="Task navigation">
          {tasks.map((task, index) => {
            const run = runByTask.get(task.id);
            return (
              <button
                className={selectedTaskIndex === index ? 'active' : ''}
                key={task.id}
                onClick={() => setSelectedTaskIndex(index)}
              >
                <span className={`taskDot ${run?.status || 'idle'}`} />
                <span>
                  <strong>{task.id}</strong>
                  {task.title}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="portalWorkspace">
        <header className="portalTopbar">
          <div>
            <p className="eyebrow">Repository</p>
            <h2>
              {bootstrap?.repository.owner || 'knurdz'}/{bootstrap?.repository.name || 'deploy-sprint-finale-test-team-01-zero'}
            </h2>
          </div>
          <a className="repoLink" href={`https://github.com/${bootstrap?.repository.owner || 'knurdz'}/${bootstrap?.repository.name || 'deploy-sprint-finale-test-team-01-zero'}`} target="_blank" rel="noreferrer">
            <GitPullRequest size={18} />
            GitHub
            <ExternalLink size={14} />
          </a>
          <button className="iconButton" onClick={() => setDrawerOpen(true)} aria-label="Open notifications">
            <Bell size={20} />
            {activeRuns.length ? <span className="notificationBadge">{activeRuns.length}</span> : null}
          </button>
        </header>

        {bootstrapError ? <div className="alertBand">{bootstrapError}</div> : null}

        {currentTask ? (
          <TaskPage
            task={currentTask}
            taskIndex={selectedTaskIndex ?? 0}
            totalTasks={tasks.length}
            bootstrap={bootstrap}
            run={runByTask.get(currentTask.id)}
            checking={runByTask.get(currentTask.id)?.status === 'running'}
            onBack={() => setSelectedTaskIndex((current) => (current === null || current <= 0 ? null : current - 1))}
            onNext={() => setSelectedTaskIndex((current) => (current === null ? 0 : Math.min(tasks.length - 1, current + 1)))}
            onCheck={() => startCheck(currentTask).catch((error) => setBootstrapError(error.message))}
          />
        ) : (
          <HomePage bootstrap={bootstrap} onStart={() => setSelectedTaskIndex(0)} />
        )}
      </section>

      <NotificationDrawer open={drawerOpen} runs={runs} onClose={() => setDrawerOpen(false)} />
    </main>
  );
}
