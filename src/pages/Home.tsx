import { useState, useEffect, useCallback, useMemo } from 'react'
import { pinyin } from 'pinyin-pro'
import { ChevronDown, Copy, Check, Globe, Database } from 'lucide-react'
import { trpc } from '@/providers/trpc'

const HERO_WORDS = [
  { pinyin: 'chuàngyì', hanzi: '创意' },
  { pinyin: 'shēnghuó', hanzi: '生活' },
  { pinyin: 'wénzì', hanzi: '文字' },
  { pinyin: 'pīnyīn', hanzi: '拼音' },
]

function RevealText({ pinyinText, hanziText, isActive }: { pinyinText: string; hanziText: string; isActive: boolean }) {
  const pinyinChars = pinyinText.split('')
  const hanziChars = [...hanziText]

  return (
    <div className={`${isActive ? 'reveal-animated' : ''}`}>
      <div className="text-center leading-none tracking-tight" style={{ fontFamily: "'Geist Mono', 'GeistMono', monospace", fontSize: 'clamp(2.5rem, 8vw, 6rem)', color: '#2D2A26', lineHeight: 0.95 }}>
        {pinyinChars.map((char, i) => (
          <span key={i} className="reveal-char">
            <span className="reveal-char-inner" style={{ animationDelay: `${i * 0.04}s` }}>{char}</span>
          </span>
        ))}
      </div>
      <div className="mt-4 text-center" style={{ fontFamily: '"Noto Serif SC", "Source Han Serif SC", serif', fontSize: 'clamp(1rem, 3vw, 2rem)', color: '#2D2A26' }}>
        {hanziChars.map((char, i) => (
          <span key={i} className="hanzi-char" style={{ animationDelay: `${i * 0.04 + 0.3}s` }}>{char}</span>
        ))}
      </div>
    </div>
  )
}

type Separator = 'none' | 'space' | 'dash'
type CaseType = 'lower' | 'upper'
type DataSource = 'baidu' | 'local'

interface CharResult { hanzi: string; pinyin: string; source: DataSource }

function getLocalPinyin(text: string, showTone: boolean): CharResult[] {
  const chars = [...text]
  const toneType = showTone ? 'symbol' : 'none'
  return chars.map((char) => ({ hanzi: char, pinyin: pinyin(char, { toneType, type: 'string' }) || char, source: 'local' as const }))
}

function removeTone(py: string): string { return pinyin(py, { toneType: 'none', type: 'string' }) }

function ResultCard({ hanzi, pinyinText, source }: { hanzi: string; pinyinText: string; source: DataSource }) {
  return (
    <div className="relative flex flex-col items-center justify-center gap-2 rounded-md px-3 py-3 transition-colors duration-150" style={{ backgroundColor: '#252422', minWidth: '64px' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2D2B28' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#252422' }}>
      {source === 'baidu' && <div className="absolute right-1 top-1 flex items-center gap-0.5" style={{ color: '#D4A853', fontSize: '9px' }} title="数据来自百度汉语"><Globe size={9} /></div>}
      <span style={{ fontFamily: "'Geist Mono', 'GeistMono', monospace", fontSize: '18px', color: '#F0EDE8', lineHeight: 1.2 }}>{pinyinText}</span>
      <div style={{ width: '100%', height: '1px', backgroundColor: 'rgba(240, 237, 232, 0.1)' }} />
      <span style={{ fontFamily: '"Noto Serif SC", "Source Han Serif SC", serif', fontSize: '20px', color: '#F0EDE8', lineHeight: 1.2 }}>{hanzi}</span>
    </div>
  )
}

function OptionButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="rounded px-3 py-1.5 text-xs transition-all duration-200" style={{ backgroundColor: active ? '#D4A853' : 'transparent', color: active ? '#1A1917' : '#8A8580', border: active ? '1px solid #D4A853' : '1px solid rgba(240, 237, 232, 0.15)' }} onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = 'rgba(240, 237, 232, 0.3)'; e.currentTarget.style.color = '#F0EDE8' } }} onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = 'rgba(240, 237, 232, 0.15)'; e.currentTarget.style.color = '#8A8580' } }}>{children}</button>
  )
}

function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button onClick={() => onChange(!checked)} className="flex items-center gap-2 text-xs transition-colors duration-200" style={{ color: '#8A8580' }}>
      <div className="relative h-5 w-9 rounded-full transition-colors duration-200" style={{ backgroundColor: checked ? '#D4A853' : 'rgba(240, 237, 232, 0.15)' }}>
        <div className="absolute top-0.5 h-4 w-4 rounded-full transition-transform duration-200" style={{ backgroundColor: '#F0EDE8', transform: checked ? 'translateX(18px)' : 'translateX(2px)' }} />
      </div>
      <span style={{ color: checked ? '#F0EDE8' : '#8A8580' }}>{label}</span>
    </button>
  )
}

export default function Home() {
  const [input, setInput] = useState('')
  const [showTone, setShowTone] = useState(true)
  const [separator, setSeparator] = useState<Separator>('space')
  const [caseType, setCaseType] = useState<CaseType>('lower')
  const [debouncedText, setDebouncedText] = useState('')

  useEffect(() => { const timer = setTimeout(() => setDebouncedText(input.trim()), 400); return () => clearTimeout(timer) }, [input])

  const baiduQuery = trpc.pinyin.lookup.useQuery(
    { text: debouncedText },
    { enabled: debouncedText.length > 0, retry: 1, staleTime: 1000 * 60 * 5 }
  )

  const results: CharResult[] = useMemo(() => {
    if (!debouncedText) return []
    if (baiduQuery.isLoading) return []
    if (baiduQuery.data?.source === 'baidu' && baiduQuery.data.results.length > 0) {
      let baiduResults = baiduQuery.data.results.map((r) => ({ hanzi: r.hanzi, pinyin: r.pinyin, source: 'baidu' as const }))
      if (!showTone) baiduResults = baiduResults.map((r) => ({ ...r, pinyin: removeTone(r.pinyin) }))
      return baiduResults
    }
    return getLocalPinyin(debouncedText, showTone)
  }, [debouncedText, baiduQuery.data, baiduQuery.isLoading, showTone])

  const dataSource: DataSource = baiduQuery.data?.source === 'baidu' ? 'baidu' : 'local'
  const baiduFailed = debouncedText.length > 0 && !baiduQuery.isLoading && baiduQuery.data?.source === 'local'

  const fullPinyin = useMemo(() => {
    if (results.length === 0) return ''
    const sep = separator === 'space' ? ' ' : separator === 'dash' ? '-' : ''
    const joined = results.map((r) => r.pinyin).join(sep)
    return caseType === 'upper' ? joined.toUpperCase() : joined
  }, [results, separator, caseType])

  const [heroIndex, setHeroIndex] = useState(0)
  const [heroActive, setHeroActive] = useState(false)

  useEffect(() => { const startTimer = setTimeout(() => setHeroActive(true), 400); return () => clearTimeout(startTimer) }, [])
  useEffect(() => {
    if (!heroActive || heroIndex >= HERO_WORDS.length - 1) return
    const timer = setTimeout(() => { setHeroActive(false); setTimeout(() => { setHeroIndex((prev) => prev + 1); setHeroActive(true) }, 200) }, 2800)
    return () => clearTimeout(timer)
  }, [heroIndex, heroActive])

  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback(async () => {
    if (!fullPinyin) return
    try { await navigator.clipboard.writeText(fullPinyin) } catch {
      const ta = document.createElement('textarea'); ta.value = fullPinyin; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }, [fullPinyin])

  const currentWord = HERO_WORDS[heroIndex]

  return (
    <div>
      <section className="relative flex flex-col items-center justify-center" style={{ height: '100dvh', backgroundColor: '#F4F1EC', padding: '8vh 5vw' }}>
        <div className="absolute left-5 top-8 uppercase" style={{ color: '#8A8580', fontSize: '11px', letterSpacing: '0.08em' }}>汉字 · 拼音</div>
        <div className="absolute bottom-8 left-8 uppercase" style={{ color: '#8A8580', fontSize: '11px', letterSpacing: '0.08em' }}>HÀNZÌ · PĪNYĪN</div>
        <div className="absolute bottom-8 right-8 flex items-center gap-2 text-xs" style={{ color: '#8A8580' }}><span style={{ fontSize: '11px', letterSpacing: '0.08em' }}>输入文字，开始转换</span><ChevronDown size={14} /></div>
        <div className="flex flex-col items-center"><RevealText key={heroIndex} pinyinText={currentWord.pinyin} hanziText={currentWord.hanzi} isActive={heroActive} /></div>
      </section>

      <section style={{ minHeight: '100dvh', backgroundColor: '#1A1917', padding: '80px 5vw 120px' }}>
        <div className="mx-auto" style={{ maxWidth: '800px' }}>
          <div className="mb-10 flex items-center justify-between uppercase" style={{ color: '#8A8580', fontSize: '11px', letterSpacing: '0.08em' }}>
            <span>汉语转拼音工具</span>
            {dataSource === 'baidu' ? <span className="flex items-center gap-1" style={{ color: '#D4A853' }}><Globe size={11} />百度汉语</span> : <span className="flex items-center gap-1"><Database size={11} />本地转换</span>}
          </div>

          <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="在此输入汉字..." className="w-full resize-y rounded outline-none transition-colors duration-200" style={{ minHeight: '120px', padding: '20px', backgroundColor: 'transparent', color: '#F0EDE8', border: '1px solid rgba(240, 237, 232, 0.2)', fontFamily: '"Noto Serif SC", "Source Han Serif SC", serif', fontSize: '18px', lineHeight: 1.6, borderRadius: '4px' }} onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(240, 237, 232, 0.5)' }} onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(240, 237, 232, 0.2)' }} />

          <div className="mt-6 flex flex-wrap items-center gap-6">
            <ToggleSwitch checked={showTone} onChange={setShowTone} label="显示声调" />
            <div className="flex items-center gap-2"><span className="mr-1 uppercase" style={{ color: '#8A8580', fontSize: '11px', letterSpacing: '0.08em' }}>分隔</span><OptionButton active={separator === 'none'} onClick={() => setSeparator('none')}>无</OptionButton><OptionButton active={separator === 'space'} onClick={() => setSeparator('space')}>空格</OptionButton><OptionButton active={separator === 'dash'} onClick={() => setSeparator('dash')}>-</OptionButton></div>
            <div className="flex items-center gap-2"><span className="mr-1 uppercase" style={{ color: '#8A8580', fontSize: '11px', letterSpacing: '0.08em' }}>大小写</span><OptionButton active={caseType === 'lower'} onClick={() => setCaseType('lower')}>小写</OptionButton><OptionButton active={caseType === 'upper'} onClick={() => setCaseType('upper')}>大写</OptionButton></div>
          </div>

          <div className="mt-8">
            {results.length === 0 ? (
              <div className="py-16 text-center" style={{ color: '#8A8580', fontSize: '14px' }}>{baiduQuery.isLoading && debouncedText ? '正在查询百度汉语...' : '输入汉字上方，拼音将显示在这里'}</div>
            ) : (
              <>
                {baiduFailed && <div className="mb-3 rounded px-3 py-2 text-xs" style={{ color: '#8A8580', backgroundColor: 'rgba(240, 237, 232, 0.05)', border: '1px solid rgba(240, 237, 232, 0.08)' }}>百度汉语未返回精确匹配结果，已使用本地转换引擎。多音字可能不够准确。</div>}
                <div className="mb-4 flex items-center justify-between rounded px-4 py-3" style={{ backgroundColor: '#252422', border: '1px solid rgba(240, 237, 232, 0.08)' }}>
                  <span className="flex items-center gap-2" style={{ fontFamily: "'Geist Mono', 'GeistMono', monospace", fontSize: '16px', color: '#F0EDE8', wordBreak: 'break-all' }}>{fullPinyin}{dataSource === 'baidu' && <span title="来自百度汉语"><Globe size={12} style={{ color: '#D4A853', flexShrink: 0 }} /></span>}</span>
                  <button onClick={handleCopy} className="ml-4 flex shrink-0 items-center gap-1.5 rounded px-3 py-1.5 text-xs transition-colors duration-200" style={{ color: copied ? '#D4A853' : '#8A8580', border: copied ? '1px solid #D4A853' : '1px solid rgba(240, 237, 232, 0.15)' }} onMouseEnter={(e) => { if (!copied) { e.currentTarget.style.borderColor = 'rgba(240, 237, 232, 0.3)'; e.currentTarget.style.color = '#F0EDE8' } }} onMouseLeave={(e) => { if (!copied) { e.currentTarget.style.borderColor = 'rgba(240, 237, 232, 0.15)'; e.currentTarget.style.color = '#8A8580' } }}>{copied ? <><Check size={13} /><span>已复制</span></> : <><Copy size={13} /><span>复制</span></>}</button>
                </div>
                <div className="flex flex-wrap gap-2">{results.map((r, i) => <ResultCard key={i} hanzi={r.hanzi} pinyinText={r.pinyin} source={r.source} />)}</div>
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="flex items-center justify-between" style={{ backgroundColor: '#1A1917', borderTop: '1px solid rgba(240, 237, 232, 0.1)', padding: '40px 5vw' }}>
        <span style={{ color: '#8A8580', fontSize: '11px', letterSpacing: '0.08em' }}>由百度汉语 + pinyin-pro 驱动</span>
        <span style={{ color: '#8A8580', fontSize: '11px', letterSpacing: '0.08em' }}>© 2025</span>
      </footer>
    </div>
  )
}
