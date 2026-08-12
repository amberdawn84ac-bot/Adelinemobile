import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HOMESTEAD_SOURCES, OKLAHOMA_HISTORY_PROJECT, PUBLIC_DOMAIN_BOOKS } from '../data/libraryCatalog'

type Tab = 'books' | 'homestead' | 'oklahoma'

export default function LibraryShelf() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('books')
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const selectedBook = useMemo(
    () => PUBLIC_DOMAIN_BOOKS.find(book => book.id === selectedBookId) ?? null,
    [selectedBookId]
  )

  if (selectedBook?.readingUrl) {
    return (
      <div className="min-h-screen bg-stone-950 text-white flex flex-col">
        <div className="h-14 shrink-0 px-4 flex items-center gap-3 bg-stone-900 border-b border-white/10">
          <button onClick={() => setSelectedBookId(null)} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm">← Shelf</button>
          <div className="min-w-0">
            <div className="font-semibold truncate">{selectedBook.title}</div>
            <div className="text-xs text-stone-400 truncate">{selectedBook.author} · {selectedBook.year}</div>
          </div>
          <a href={selectedBook.sourceUrl} target="_blank" rel="noreferrer" className="ml-auto text-xs text-amber-300 hover:text-amber-200">Source ↗</a>
        </div>
        <div className="bg-amber-50 text-amber-950 px-4 py-2 text-xs">
          This reader displays a verified public-domain U.S. edition from Project Gutenberg. If the embedded reader is blocked by the source, use Source to open it directly.
        </div>
        <iframe title={selectedBook.title} src={selectedBook.readingUrl} className="w-full flex-1 bg-white min-h-[calc(100vh-86px)]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-stone-50 to-emerald-50 text-stone-800">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/game')} className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-sm font-semibold">← Town</button>
          <div>
            <h1 className="text-xl font-serif font-bold">The Library</h1>
            <p className="text-xs text-stone-500">Read old books. Investigate new ideas. Keep the receipts.</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-3 mb-7">
          <button onClick={() => setTab('books')} className={`rounded-2xl p-4 text-left border ${tab === 'books' ? 'bg-amber-100 border-amber-300' : 'bg-white border-stone-200'}`}>
            <div className="font-bold">Public-Domain Shelf</div>
            <div className="text-sm text-stone-600 mt-1">Books we can legally republish, annotate, and reillustrate after verification.</div>
          </button>
          <button onClick={() => setTab('homestead')} className={`rounded-2xl p-4 text-left border ${tab === 'homestead' ? 'bg-emerald-100 border-emerald-300' : 'bg-white border-stone-200'}`}>
            <div className="font-bold">Homestead Research</div>
            <div className="text-sm text-stone-600 mt-1">Modern sources worth using as research portals without copying their articles.</div>
          </button>
          <button onClick={() => setTab('oklahoma')} className={`rounded-2xl p-4 text-left border ${tab === 'oklahoma' ? 'bg-sky-100 border-sky-300' : 'bg-white border-stone-200'}`}>
            <div className="font-bold">Oklahoma History Project</div>
            <div className="text-sm text-stone-600 mt-1">An original Dear Adeline book that interrogates the standard story.</div>
          </button>
        </div>

        {tab === 'books' && (
          <section>
            <div className="mb-5">
              <h2 className="text-2xl font-serif font-bold">Books waiting on the shelf</h2>
              <p className="text-sm text-stone-600 max-w-3xl mt-1">These are verified public-domain U.S. editions. That makes them candidates for a Dear Adeline edition with new covers, new illustrations, modern annotations, vocabulary help, discussion trails, and mission links.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {PUBLIC_DOMAIN_BOOKS.map((book, index) => (
                <article key={book.id} className="relative bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                  <div className={`h-48 p-5 flex flex-col justify-between ${index % 3 === 0 ? 'bg-amber-200' : index % 3 === 1 ? 'bg-emerald-200' : 'bg-sky-200'}`}>
                    <span className="text-4xl">{book.coverEmoji}</span>
                    <div>
                      <div className="font-serif font-black text-xl leading-tight">{book.title}</div>
                      <div className="text-xs mt-2 opacity-70">{book.author} · {book.year}</div>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <p className="text-sm text-stone-600">{book.description}</p>
                    <div className="flex flex-wrap gap-1.5">{book.subjects.map(subject => <span key={subject} className="text-[10px] px-2 py-1 rounded-full bg-stone-100">{subject}</span>)}</div>
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedBookId(book.id)} className="flex-1 rounded-xl bg-stone-900 text-white px-3 py-2 text-sm font-semibold hover:bg-stone-800">Read in Library</button>
                      <a href={book.sourceUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-stone-200 px-3 py-2 text-sm font-semibold hover:bg-stone-50">Source</a>
                    </div>
                    {book.notes && <p className="text-[11px] text-stone-500">{book.notes}</p>}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === 'homestead' && (
          <section>
            <h2 className="text-2xl font-serif font-bold">Homestead Research Desk</h2>
            <p className="text-sm text-stone-600 max-w-3xl mt-1 mb-5">These sources stay external unless we receive permission or verify a license that allows reuse. Dear Adeline can send a student there with a research question, then bring the student back to document what they learned.</p>
            <div className="grid md:grid-cols-2 gap-4">
              {HOMESTEAD_SOURCES.map(source => (
                <article key={source.id} className="bg-white rounded-2xl border border-stone-200 p-5">
                  <div className="text-xs uppercase tracking-wide font-bold text-emerald-700">{source.provider}</div>
                  <h3 className="text-xl font-bold mt-1">{source.title}</h3>
                  <p className="text-sm text-stone-600 mt-2">{source.description}</p>
                  <div className="flex flex-wrap gap-1.5 my-4">{source.topics.map(topic => <span key={topic} className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-800">{topic}</span>)}</div>
                  <a href={source.url} target="_blank" rel="noreferrer" className="inline-block rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 text-sm font-semibold">Open Research Source ↗</a>
                  <p className="mt-3 text-[11px] text-stone-500">Policy: link and research. Do not copy full articles, photos, recipes, or branded material into Dear Adeline without permission.</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === 'oklahoma' && (
          <section className="bg-white rounded-3xl border border-stone-200 p-6 md:p-8">
            <div className="text-xs uppercase tracking-wider font-bold text-sky-700">Original Dear Adeline Book · In Development</div>
            <h2 className="text-3xl font-serif font-black mt-2">{OKLAHOMA_HISTORY_PROJECT.title}</h2>
            <p className="text-stone-600 mt-3 max-w-3xl">{OKLAHOMA_HISTORY_PROJECT.description}</p>
            <div className="mt-6 grid md:grid-cols-2 gap-3">
              {OKLAHOMA_HISTORY_PROJECT.designPrinciples.map((principle, i) => (
                <div key={principle} className="rounded-xl bg-sky-50 border border-sky-100 p-4 text-sm"><span className="font-bold text-sky-700 mr-2">{i + 1}.</span>{principle}</div>
              ))}
            </div>
            <div className="mt-6 bg-stone-900 text-white rounded-2xl p-5">
              <div className="font-bold">Chapter format</div>
              <p className="text-sm text-stone-300 mt-2">The story everyone knows → what the primary sources show → what was left out → who gained and who paid → what is disputed → evidence room → student verdict.</p>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
