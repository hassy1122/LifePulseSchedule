import { useMemo, useRef, useState } from "react"
import { Heading2, Bold, Italic, Code, List, CodeXml, Plus, Search, Tag, Trash2, X, Eye, PenLine, StickyNote } from "lucide-react"
import { uid } from "../lib/utils"
import { EmptyState, PageHeader } from "../components/ui"

/* ---------- Tiny safe markdown renderer (React nodes, no HTML injection) ---------- */

function inline(src) {
  const parts = []
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g
  let last = 0, key = 0, m
  while ((m = re.exec(src))) {
    if (m.index > last) parts.push(src.slice(last, m.index))
    const t = m[0]
    if (t.startsWith("**")) parts.push(<strong key={key++} className="font-bold text-slate-900">{t.slice(2, -2)}</strong>)
    else if (t.startsWith("`")) parts.push(<code key={key++} className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-violet-700">{t.slice(1, -1)}</code>)
    else parts.push(<em key={key++} className="italic">{t.slice(1, -1)}</em>)
    last = m.index + t.length
  }
  if (last < src.length) parts.push(src.slice(last))
  return parts
}

function Markdown({ src }) {
  const lines = src.split("\n")
  const out = []
  let i = 0, key = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.trim() === "") { i++; continue }
    if (line.startsWith("```")) {
      const buf = []
      i++
      while (i < lines.length && !lines[i].startsWith("```")) buf.push(lines[i++])
      i++
      out.push(
        <pre key={key++} className="my-3 overflow-x-auto rounded-xl bg-slate-900 p-4 text-[13px] leading-relaxed text-slate-100">
          <code className="font-mono">{buf.join("\n")}</code>
        </pre>
      )
      continue
    }
    if (/^###\s/.test(line)) { out.push(<p key={key++} className="mt-4 text-sm font-bold uppercase tracking-wide text-slate-400">{inline(line.slice(4))}</p>); i++; continue }
    if (/^##\s/.test(line)) { out.push(<h3 key={key++} className="mt-4 text-base font-extrabold text-slate-900">{inline(line.slice(3))}</h3>); i++; continue }
    if (/^#\s/.test(line)) { out.push(<h2 key={key++} className="mt-4 text-xl font-extrabold text-slate-900">{inline(line.slice(2))}</h2>); i++; continue }
    if (/^&gt;\s|^>\s/.test(line)) {
      out.push(<blockquote key={key++} className="my-2 border-l-4 border-violet-300 pl-3 text-sm italic text-slate-500">{inline(line.replace(/^&gt;\s|^>\s/, ""))}</blockquote>)
      i++; continue
    }
    if (/^[-*]\s+/.test(line)) {
      const items = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) items.push(lines[i].replace(/^[-*]\s+/, ""))
      i++
      out.push(
        <ul key={key++} className="my-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
          {items.map((it, n) => <li key={n}>{inline(it)}</li>)}
        </ul>
      )
      continue
    }
    out.push(<p key={key++} className="my-1.5 text-sm leading-relaxed text-slate-700">{inline(line)}</p>)
    i++
  }
  return <div>{out}</div>
}

/* ---------- Note editor ---------- */

export default function Notes({ data, patch }) {
  const notes = useMemo(
    () => [...data.notes].sort((a, b) => b.updatedAt - a.updatedAt),
    [data.notes],
  )
  const [selectedId, setSelectedId] = useState(notes[0]?.id || null)
  const [query, setQuery] = useState("")
  const [tagFilter, setTagFilter] = useState(null)
  const [preview, setPreview] = useState(false)
  const taRef = useRef(null)

  const allTags = useMemo(() => [...new Set(notes.flatMap((n) => n.tags))].sort(), [notes])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return notes.filter((n) => {
      if (tagFilter && !n.tags.includes(tagFilter)) return false
      if (!q) return true
      return n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q) || n.tags.some((t) => t.includes(q))
    })
  }, [notes, query, tagFilter])

  const selected = notes.find((n) => n.id === selectedId) || filtered[0] || null

  function modify(id, mutate) {
    patch((d) => {
      const n = d.notes.find((x) => x.id === id)
      if (!n) return
      mutate(n)
      n.updatedAt = Date.now()
    })
  }

  function createNote() {
    const id = uid("n")
    patch((d) => {
      d.notes.push({ id, title: "Untitled note", body: "", tags: [], updatedAt: Date.now() })
    })
    setSelectedId(id)
    setPreview(false)
    setQuery("")
    setTagFilter(null)
  }

  function removeNote(id) {
    patch((d) => {
      d.notes = d.notes.filter((n) => n.id !== id)
    })
    if (selectedId === id) setSelectedId(notes.find((n) => n.id !== id)?.id || null)
  }

  /** Toolbar: wrap selection or insert at cursor. */
  function insert(before, after = "", placeholder = "") {
    const ta = taRef.current
    if (!ta || !selected) return
    const { selectionStart: s, selectionEnd: e } = ta
    const sel = ta.value.slice(s, e) || placeholder
    const body = selected.body
    const next = body.slice(0, s) + before + sel + after + body.slice(e)
    modify(selected.id, (n) => { n.body = next })
    requestAnimationFrame(() => {
      ta.focus()
      const pos = s + before.length + sel.length + after.length
      ta.setSelectionRange(pos, pos)
    })
  }

const TOOLBAR = [
  { icon: Bold, label: "Bold (markdown **)", args: ["**", "**", "bold text"] },
  { icon: Italic, label: "Italic (markdown *)", args: ["*", "*", "italic text"] },
  { icon: Code, label: "Inline code", args: ["`", "`", "code"] },
  { icon: Heading2, label: "Heading", args: ["\n## ", "", "Section title"] },
  { icon: List, label: "Bullet list", args: ["\n- ", "", "list item"] },
  { icon: CodeXml, label: "Code block", args: ["\n```js\n", "\n```\n", "// snippet"] },
]

  return (
    <div>
      <PageHeader title="Notes" subtitle="Markdown workspace with instant search, code snippets and tags.">
        <button type="button" className="btn-primary" onClick={createNote}>
          <Plus className="h-4 w-4" aria-hidden="true" /> New note
        </button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* List column */}
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              className="input pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes…"
              aria-label="Search notes"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <div aria-label="Tag filter" className="flex flex-wrap gap-1.5">
            {allTags.map((t) => {
              const active = tagFilter === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTagFilter(active ? null : t)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold transition focus-visible:outline-2 focus-visible:outline-violet-500 ${
                    active ? "border-violet-300 bg-violet-50 text-violet-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <Tag className="h-3 w-3" aria-hidden="true" /> {t}
                </button>
              )
            })}
          </div>

          <ul className="scroll-slim max-h-[520px] space-y-2 overflow-y-auto pr-0.5" aria-label="Notes">
            {filtered.length === 0 ? (
              <EmptyState icon={Search} title="No matches" hint="Try a different search term or clear the tag filter." />
            ) : (
              filtered.map((n) => {
                const active = selected?.id === n.id
                return (
                  <li key={n.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedId(n.id)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedId(n.id) } }}
                      aria-current={active ? "true" : undefined}
                      className={`w-full cursor-pointer rounded-2xl border p-3.5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 ${
                        active ? "border-violet-200 bg-violet-50/70 shadow-sm" : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`truncate text-sm font-bold ${active ? "text-violet-800" : "text-slate-800"}`}>{n.title || "Untitled"}</span>
                        <button
                          type="button"
                          aria-label={`Delete note ${n.title}`}
                          onClick={(e) => { e.stopPropagation(); removeNote(n.id) }}
                          className="shrink-0 rounded-md p-1 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 focus-visible:outline-2 focus-visible:outline-violet-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                      <span className="mt-1 block truncate text-xs text-slate-400">{n.body.replace(/[#*`>-]/g, "") || "Empty note"}</span>
                      <span className="mt-2 flex flex-wrap gap-1">
                        {n.tags.map((t) => (
                          <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">#{t}</span>
                        ))}
                      </span>
                    </div>
                  </li>
                )
              })
            )}
          </ul>
        </div>

        {/* Editor column */}
        <section className="card flex min-h-[560px] flex-col" aria-label="Note editor">
          {selected == null ? (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState icon={StickyNote} title="No note selected" hint="Create a note to start writing." />
            </div>
          ) : (
            <>
              {/* Title + meta */}
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <input
                  className="w-full min-w-0 flex-1 border-0 bg-transparent p-0 text-lg font-extrabold tracking-tight text-slate-900 placeholder:text-slate-300 focus:outline-none focus-visible:outline-none"
                  value={selected.title}
                  onChange={(e) => modify(selected.id, (n) => { n.title = e.target.value })}
                  placeholder="Note title"
                  aria-label="Note title"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreview((p) => !p)}
                    aria-pressed={preview}
                    className="btn-soft !h-8 !px-3 text-xs"
                  >
                    {preview ? <PenLine className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
                    {preview ? "Edit" : "Preview"}
                  </button>
                </div>
              </div>

              {/* Tags editor */}
              <div className="mb-4 flex flex-wrap items-center gap-1.5">
                {selected.tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700">
                    #{t}
                    <button
                      type="button"
                      onClick={() => modify(selected.id, (n) => { n.tags = n.tags.filter((x) => x !== t) })}
                      aria-label={`Remove tag ${t}`}
                      className="rounded-full p-0.5 hover:bg-violet-100"
                    >
                      <X className="h-2.5 w-2.5" aria-hidden="true" />
                    </button>
                  </span>
                ))}
                <AddTag onAdd={(t) => modify(selected.id, (n) => { if (!n.tags.includes(t)) n.tags.push(t) })} />
              </div>

              {preview ? (
                <div className="scroll-slim min-h-0 flex-1 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <Markdown src={selected.body || "Nothing to preview yet."} />
                </div>
              ) : (
                <>
                  {/* Toolbar */}
                  <div className="mb-2 flex flex-wrap gap-1" role="toolbar" aria-label="Formatting">
                    {TOOLBAR.map((b) => (
                      <button
                        key={b.label}
                        type="button"
                        onClick={() => insert(...b.args)}
                        aria-label={b.label}
                        title={b.label}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-violet-500"
                      >
                        <b.icon className="h-4 w-4" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                  <textarea
                    ref={taRef}
                    className="scroll-slim min-h-0 flex-1 resize-none rounded-2xl border border-slate-200 bg-[#FBFCFE] p-4 font-mono text-sm leading-relaxed text-slate-800 transition placeholder:text-slate-300 focus-visible:border-violet-300 focus-visible:outline-2 focus-visible:outline-violet-500"
                    value={selected.body}
                    onChange={(e) => modify(selected.id, (n) => { n.body = e.target.value })}
                    placeholder={"Write here… supports **markdown**, `inline code`, lists and ```code blocks```"}
                    spellCheck={false}
                    aria-label="Note body"
                  />
                  <p className="mt-2 text-[11px] font-medium text-slate-400">
                    Saves automatically to your browser · Last saved {new Date(selected.updatedAt).toLocaleString()}
                  </p>
                </>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}

function AddTag({ onAdd }) {
  const [v, setV] = useState("")
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const t = v.trim().toLowerCase().replace(/^#/, "")
        if (!t) return
        onAdd(t)
        setV("")
      }}
    >
      <input
        className="w-24 rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-[11px] font-bold text-slate-600 transition placeholder:text-slate-300 focus:border-violet-400 focus:outline-none"
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="+ tag"
        aria-label="Add tag"
      />
    </form>
  )
}
