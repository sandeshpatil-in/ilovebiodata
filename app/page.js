'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { toast, Toaster } from 'sonner'
import { ChevronLeft, ChevronRight, Download, Eye, Heart, Plus, Sparkles, Trash2, Upload, X, Check, Camera } from 'lucide-react'
import BiodataView from '@/components/biodata/BiodataView'
import GodIcon from '@/components/biodata/GodIcon'
import { motion, AnimatePresence } from 'framer-motion'

// ---------- Constants (Marathi) ----------
const GODS = [
  { key: 'ganpati', name: 'श्री गणेश', temple: 'गणपती' },
  { key: 'vitthal', name: 'श्री विठ्ठल', temple: 'विठ्ठल' },
  { key: 'tuljabhavani', name: 'श्री तुळजाभवानी', temple: 'तुळजाभवानी' },
  { key: 'mahalaxmi', name: 'श्री महालक्ष्मी', temple: 'महालक्ष्मी' },
  { key: 'jyotiba', name: 'श्री ज्योतिबा', temple: 'ज्योतिबा' },
  { key: 'shiv', name: 'श्री शिव', temple: 'शिव' },
  { key: 'datta', name: 'श्री दत्त', temple: 'दत्त' },
  { key: 'khandoba', name: 'श्री खंडोबा', temple: 'खंडोबा' },
  { key: 'ram', name: 'श्री राम', temple: 'राम' },
  { key: 'krishna', name: 'श्री कृष्ण', temple: 'कृष्ण' },
]

const RASHIS = ['मेष','वृषभ','मिथुन','कर्क','सिंह','कन्या','तूळ','वृश्चिक','धनु','मकर','कुंभ','मीन']
const NAKSHATRAS = ['अश्विनी','भरणी','कृत्तिका','रोहिणी','मृग','आर्द्रा','पुनर्वसू','पुष्य','आश्लेषा','मघा','पूर्वा फाल्गुनी','उत्तरा फाल्गुनी','हस्त','चित्रा','स्वाती','विशाखा','अनुराधा','ज्येष्ठा','मूळ','पूर्वाषाढा','उत्तराषाढा','श्रवण','धनिष्ठा','शततारका','पूर्वा भाद्रपदा','उत्तरा भाद्रपदा','रेवती']
const GANS = ['देव','मनुष्य','राक्षस']
const NADIS = ['आदि','मध्य','अंत्य']
const MANGAL = ['नाही','सौम्य','मंगळ']
const COMPLEXIONS = ['गोरा','सावळा','गव्हाळ','उजळ']
const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-']
const MARITAL = ['अविवाहित','विवाहित','विधवा/विधुर','घटस्फोटित']
const STATES = ['महाराष्ट्र','गोवा','कर्नाटक','गुजरात','मध्य प्रदेश','तेलंगणा','अन्य']
const NAME_PREFIX = ['चि.','कु.','सौ.','श्री.']

const STEPS = [
  { key: 'god', label: 'देव निवडा' },
  { key: 'basic', label: 'मूलभूत माहिती' },
  { key: 'edu', label: 'शिक्षण व व्यवसाय' },
  { key: 'family', label: 'कौटुंबिक माहिती' },
  { key: 'relatives', label: 'नातेवाईक' },
  { key: 'contact', label: 'संपर्क' },
]

const emptyData = () => ({
  god: { key: 'ganpati', name: 'श्री गणेश', temple: '', shlok: '', customImage: '' },
  namePrefix: 'चि.', firstName: '', middleName: '', lastName: '',
  dob: '', birthTime: '', birthPlace: '',
  rashi: '', nakshatra: '', gotra: '', gan: '', nadi: '', mangal: '',
  height: '', weight: '', bloodGroup: '', complexion: '',
  kuldaivat: '', caste: 'हिंदू', subCaste: '', maritalStatus: 'अविवाहित',
  disability: '', hobbies: '', photo: '',
  education: '', college: '', degree: '', job: '', company: '', business: '',
  annualIncome: '', monthlyIncome: '', farm: '', land: '', house: '', flat: '', vehicle: '', otherAssets: '',
  fatherName: '', fatherOccupation: '', motherName: '', motherOccupation: '',
  brothers: [], sisters: [], familyCount: '',
  relatives: { mama: [''], mami: [''], kaka: [''], kaku: [''], atya: [''], mavshi: [''], chulte: [''], ajoba: [''], aji: [''] },
  address: '', village: '', taluka: '', district: '', state: 'महाराष्ट्र', pincode: '',
  mobile: '', mobile2: '', whatsapp: '', email: '',
  customFields: [],
})

const cx = (...c) => c.filter(Boolean).join(' ')

const compressImageToDataURL = (file, maxW = 900, quality = 0.85) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onerror = reject
  reader.onload = () => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width)
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = reader.result
  }
  reader.readAsDataURL(file)
})

const samplePreviewData = () => ({
  god: { key: 'ganpati', name: 'श्री गणेश', temple: 'गणपती', shlok: 'वक्रतुण्ड महाकाय' },
  namePrefix: 'चि.', firstName: 'ऋषिकेश', middleName: 'माणिक', lastName: 'पाटील',
  dob: '06/11/1996', birthTime: 'रात्री ११:३० मि.', birthPlace: 'सुरूल',
  rashi: 'धनु', nakshatra: 'मूळ', height: "5 फूट 6 इंच", complexion: 'गोरा', bloodGroup: 'AB+',
  kuldaivat: 'श्री ज्योतिबा', caste: 'हिंदू - मराठा', subCaste: '९६ कुळी',
  education: 'M.A. (Eco)', job: 'Sr. Business Development Associate', company: 'Bank of Baroda, Pune',
  annualIncome: '८ लाख रु.', farm: '२ एकर बागायत',
  fatherName: 'श्री. माणिक हरी पाटील', fatherOccupation: 'शेती', motherName: 'सौ. लता माणिक पाटील',
  address: 'मु.पो. येलूर, ता. वाळवा, जि. सांगली', mobile: '9730702976', mobile2: '8600145772',
  relatives: { mama: ['श्री. अशोक आनंदा पाटील','श्री. संजय आनंदा पाटील'], kaka: [], kaku:[], mami:[], atya:['श्री. भिमराव रंगराव पाटील'], mavshi:[], chulte:['श्री. कुमार हरी पाटील'], ajoba:[], aji:[] },
})

// ---------- Landing ----------
const Landing = ({ onStart, onGoTemplates }) => (
  <div className="min-h-screen bg-white font-marathi">
    <nav className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-[#E8D8A8]">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8"><GodIcon size={32} name="ई" /></div>
          <div className="font-baloo font-bold text-lg text-gold-gradient">ILoveBiodata</div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onGoTemplates} className="text-[#7A1F1F] font-semibold">टेम्पलेट्स</Button>
          <Button onClick={onStart} className="bg-[#B8860B] hover:bg-[#9c7009] text-white rounded-full px-4">सुरू करा</Button>
        </div>
      </div>
    </nav>

    <section className="relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-40" style={{background:'radial-gradient(60% 40% at 50% 0%, #F6EFD4 0%, transparent 70%)'}} />
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-8 md:pt-20 md:pb-14 text-center relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E8D8A8] bg-[#FFFDF5] text-[#7A1F1F] text-xs md:text-sm mb-4">
          <Sparkles className="w-3.5 h-3.5" /> पारंपरिक • प्रीमियम • मराठी
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight text-[#2b2b2b]">
          <span className="text-gold-gradient">मराठी विवाह परिचय पत्र</span> तयार करा
        </h1>
        <p className="mt-4 text-base md:text-lg text-neutral-600 max-w-2xl mx-auto">
          फक्त ५ मिनिटांत सुंदर विवाह बायोडाटा तयार करा — पारंपरिक डिझाईन, मोफत PDF डाउनलोड.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
          <Button onClick={onStart} size="lg" className="bg-[#B8860B] hover:bg-[#9c7009] text-white rounded-full px-8 h-12 text-base font-semibold shadow-md">
            मोफत सुरू करा <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
          <Button onClick={onGoTemplates} variant="outline" size="lg" className="rounded-full px-6 h-12 border-[#E8D8A8] text-[#7A1F1F] hover:bg-[#FDF7E5]">
            <Eye className="w-4 h-4 mr-2" /> टेम्पलेट पहा
          </Button>
        </div>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
          {['मोबाइलवर सहज वापरा','PDF डाउनलोड','पारंपरिक डिझाईन','मराठी भाषा'].map((f) => (
            <div key={f} className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl border border-[#E8D8A8] bg-[#FFFDF5] text-sm text-[#333] font-medium">
              <Check className="w-4 h-4 text-[#B8860B]" /> {f}
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <div className="flex items-end justify-between mb-4">
        <h2 className="text-2xl md:text-3xl font-bold text-[#2b2b2b]">प्रीमियम <span className="text-gold-gradient">टेम्पलेट्स</span></h2>
        <div className="text-sm text-neutral-500">३ प्रीमियम डिझाईन</div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[
          { key: 't1', title: 'पारंपरिक सुवर्ण', sub: 'Traditional Gold Border' },
          { key: 't2', title: 'रॉयल मरून', sub: 'Royal Maroon' },
          { key: 't3', title: 'मिनिमल मॉडर्न', sub: 'Minimal Modern' },
        ].map((t) => (
          <Card key={t.key} className="p-0 overflow-hidden border-[#E8D8A8] bg-white cursor-pointer hover:shadow-lg transition-shadow" onClick={onStart}>
            <div className="p-3 border-b border-[#E8D8A8] flex items-center justify-between">
              <div>
                <div className="font-semibold text-[#2b2b2b]">{t.title}</div>
                <div className="text-xs text-neutral-500">{t.sub}</div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-[#FDF7E5] text-[#7A1F1F]">प्रीमियम</span>
            </div>
            <div className="p-3 bg-[#FBF7EA]">
              <div className="scale-[0.95] origin-top">
                <BiodataView template={t.key} data={samplePreviewData()} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>

    <section className="mx-auto max-w-4xl px-4 py-10 text-center">
      <div className="rounded-2xl border border-[#E8D8A8] bg-[#FFFDF5] p-6 md:p-10">
        <h3 className="text-2xl md:text-3xl font-bold text-[#2b2b2b]">आजच <span className="text-gold-gradient">मोफत</span> बायोडाटा तयार करा</h3>
        <p className="text-neutral-600 mt-2">काही मिनिटांत छापण्यायोग्य A4 PDF डाउनलोड करा.</p>
        <Button onClick={onStart} size="lg" className="mt-5 bg-[#7A1F1F] hover:bg-[#5f1616] text-white rounded-full px-8 h-12 font-semibold">
          <Heart className="w-4 h-4 mr-2" /> सुरू करा
        </Button>
      </div>
    </section>

    <footer className="border-t border-[#E8D8A8] py-6 text-center text-sm text-neutral-500">
      © {new Date().getFullYear()} ILoveBiodata.com — प्रेमाने बनवलेले ❤ महाराष्ट्रासाठी
    </footer>
  </div>
)

// ---------- Form primitives ----------
const Field = ({ label, children, className }) => (
  <div className={cx('space-y-1.5', className)}>
    <Label className="text-sm font-semibold text-[#7A1F1F]">{label}</Label>
    {children}
  </div>
)
const RoundInput = (props) => (
  <Input {...props} className={cx('rounded-full h-11 border-[#E8D8A8] focus-visible:ring-[#B8860B] bg-white', props.className)} />
)
const RoundTextarea = (props) => (
  <Textarea {...props} className={cx('rounded-2xl border-[#E8D8A8] focus-visible:ring-[#B8860B] bg-white', props.className)} />
)
const RoundSelect = ({ value, onValueChange, placeholder, options }) => (
  <Select value={value} onValueChange={onValueChange}>
    <SelectTrigger className="rounded-full h-11 border-[#E8D8A8] focus:ring-[#B8860B] bg-white">
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {options.map((o) => (
        <SelectItem key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
          {typeof o === 'string' ? o : o.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)

// ---------- Steps ----------
const StepGod = ({ data, update }) => {
  const setGod = (patch) => update({ god: { ...data.god, ...patch } })
  return (
    <div className="space-y-4">
      <Field label="देव निवडा">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {GODS.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => setGod({ key: g.key, name: g.name, temple: g.temple, customImage: '' })}
              className={cx('flex flex-col items-center gap-1 p-2 rounded-xl border transition',
                data.god.key === g.key ? 'border-[#B8860B] bg-[#FFFDF0] shadow-sm' : 'border-[#E8D8A8] bg-white hover:bg-[#FFFDF5]')}
            >
              <GodIcon name={g.name.replace('श्री ','')} size={48} custom={data.god.key===g.key ? data.god.customImage : ''} />
              <div className="text-xs font-medium text-[#333]">{g.name}</div>
            </button>
          ))}
        </div>
      </Field>
      <Field label="स्वतःची देव प्रतिमा (Optional)">
        <label className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-[#E8D8A8] bg-[#FFFDF5] cursor-pointer">
          <Upload className="w-4 h-4 text-[#B8860B]" />
          <span className="text-sm text-[#7A1F1F]">प्रतिमा अपलोड करा</span>
          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return
            const url = await compressImageToDataURL(f, 400, 0.9)
            setGod({ customImage: url })
            toast.success('देव प्रतिमा जोडली')
          }} />
          {data.god.customImage && <img src={data.god.customImage} className="ml-auto w-10 h-10 rounded object-cover" alt="" />}
        </label>
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="देवाचे नाव"><RoundInput value={data.god.name} onChange={(e)=>setGod({name:e.target.value})} placeholder="उदा. श्री गणेश" /></Field>
        <Field label="मंदिराचे नाव"><RoundInput value={data.god.temple} onChange={(e)=>setGod({temple:e.target.value})} placeholder="उदा. दगडूशेठ हलवाई" /></Field>
      </div>
      <Field label="श्लोक (Optional)"><RoundTextarea rows={2} value={data.god.shlok} onChange={(e)=>setGod({shlok:e.target.value})} placeholder="वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ..." /></Field>
    </div>
  )
}

const StepBasic = ({ data, update }) => {
  const onPhoto = async (e) => {
    const f = e.target.files?.[0]; if (!f) return
    const url = await compressImageToDataURL(f, 700, 0.85)
    update({ photo: url }); toast.success('फोटो जोडला')
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        <Field label="उपसर्ग" className="col-span-1"><RoundSelect value={data.namePrefix} onValueChange={(v)=>update({namePrefix:v})} placeholder="चि." options={NAME_PREFIX} /></Field>
        <Field label="नाव" className="col-span-3"><RoundInput value={data.firstName} onChange={(e)=>update({firstName:e.target.value})} placeholder="पहिले नाव" /></Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="वडिलांचे नाव / मधले नाव"><RoundInput value={data.middleName} onChange={(e)=>update({middleName:e.target.value})} placeholder="उदा. माणिक" /></Field>
        <Field label="आडनाव"><RoundInput value={data.lastName} onChange={(e)=>update({lastName:e.target.value})} placeholder="उदा. पाटील" /></Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="जन्म तारीख"><RoundInput type="date" value={data.dob} onChange={(e)=>update({dob:e.target.value})} /></Field>
        <Field label="जन्म वेळ"><RoundInput value={data.birthTime} onChange={(e)=>update({birthTime:e.target.value})} placeholder="उदा. सकाळी ०६:३०" /></Field>
      </div>
      <Field label="जन्म स्थळ"><RoundInput value={data.birthPlace} onChange={(e)=>update({birthPlace:e.target.value})} placeholder="उदा. पुणे" /></Field>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="राशी"><RoundSelect value={data.rashi} onValueChange={(v)=>update({rashi:v})} placeholder="निवडा" options={RASHIS} /></Field>
        <Field label="नक्षत्र"><RoundSelect value={data.nakshatra} onValueChange={(v)=>update({nakshatra:v})} placeholder="निवडा" options={NAKSHATRAS} /></Field>
        <Field label="गोत्र"><RoundInput value={data.gotra} onChange={(e)=>update({gotra:e.target.value})} placeholder="उदा. कश्यप" /></Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="गण"><RoundSelect value={data.gan} onValueChange={(v)=>update({gan:v})} placeholder="निवडा" options={GANS} /></Field>
        <Field label="नाडी"><RoundSelect value={data.nadi} onValueChange={(v)=>update({nadi:v})} placeholder="निवडा" options={NADIS} /></Field>
        <Field label="मंगळ"><RoundSelect value={data.mangal} onValueChange={(v)=>update({mangal:v})} placeholder="निवडा" options={MANGAL} /></Field>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Field label="उंची"><RoundInput value={data.height} onChange={(e)=>update({height:e.target.value})} placeholder={"5'8\""} /></Field>
        <Field label="वजन"><RoundInput value={data.weight} onChange={(e)=>update({weight:e.target.value})} placeholder="६५ किलो" /></Field>
        <Field label="रक्तगट"><RoundSelect value={data.bloodGroup} onValueChange={(v)=>update({bloodGroup:v})} placeholder="निवडा" options={BLOOD_GROUPS} /></Field>
        <Field label="रंग"><RoundSelect value={data.complexion} onValueChange={(v)=>update({complexion:v})} placeholder="निवडा" options={COMPLEXIONS} /></Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="कुळदैवत"><RoundInput value={data.kuldaivat} onChange={(e)=>update({kuldaivat:e.target.value})} placeholder="उदा. श्री ज्योतिबा" /></Field>
        <Field label="जात"><RoundInput value={data.caste} onChange={(e)=>update({caste:e.target.value})} placeholder="उदा. हिंदू - मराठा" /></Field>
        <Field label="उपजात"><RoundInput value={data.subCaste} onChange={(e)=>update({subCaste:e.target.value})} placeholder="उदा. ९६ कुळी" /></Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="वैवाहिक स्थिती"><RoundSelect value={data.maritalStatus} onValueChange={(v)=>update({maritalStatus:v})} placeholder="निवडा" options={MARITAL} /></Field>
        <Field label="अपंगत्व"><RoundInput value={data.disability} onChange={(e)=>update({disability:e.target.value})} placeholder="नाही" /></Field>
      </div>
      <Field label="छंद"><RoundInput value={data.hobbies} onChange={(e)=>update({hobbies:e.target.value})} placeholder="वाचन, प्रवास" /></Field>

      <Field label="फोटो अपलोड">
        <label className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-[#E8D8A8] bg-[#FFFDF5] cursor-pointer">
          <Camera className="w-4 h-4 text-[#B8860B]" />
          <span className="text-sm text-[#7A1F1F]">तुमचा फोटो निवडा</span>
          <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
          {data.photo && <img src={data.photo} className="ml-auto w-14 h-14 rounded object-cover border border-[#E8D8A8]" alt="" />}
          {data.photo && <button type="button" onClick={(e)=>{ e.preventDefault(); update({photo:''}) }} className="text-neutral-500 hover:text-red-600"><X className="w-4 h-4"/></button>}
        </label>
      </Field>
    </div>
  )
}

const StepEdu = ({ data, update }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="शिक्षण"><RoundInput value={data.education} onChange={(e)=>update({education:e.target.value})} placeholder="उदा. B.E. Computer" /></Field>
      <Field label="कॉलेज"><RoundInput value={data.college} onChange={(e)=>update({college:e.target.value})} placeholder="उदा. COEP Pune" /></Field>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="पदवी"><RoundInput value={data.degree} onChange={(e)=>update({degree:e.target.value})} placeholder="M.A. (Eco)" /></Field>
      <Field label="नोकरी"><RoundInput value={data.job} onChange={(e)=>update({job:e.target.value})} placeholder="उदा. Software Engineer" /></Field>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="कंपनी"><RoundInput value={data.company} onChange={(e)=>update({company:e.target.value})} placeholder="Bank of Baroda, Pune" /></Field>
      <Field label="व्यवसाय"><RoundInput value={data.business} onChange={(e)=>update({business:e.target.value})} placeholder="स्वतःचा व्यवसाय" /></Field>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="वार्षिक उत्पन्न"><RoundInput value={data.annualIncome} onChange={(e)=>update({annualIncome:e.target.value})} placeholder="उदा. ८ लाख रु." /></Field>
      <Field label="मासिक उत्पन्न"><RoundInput value={data.monthlyIncome} onChange={(e)=>update({monthlyIncome:e.target.value})} placeholder="उदा. ५०,००० रु." /></Field>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Field label="शेती"><RoundInput value={data.farm} onChange={(e)=>update({farm:e.target.value})} placeholder="२ एकर बागायत" /></Field>
      <Field label="जमीन"><RoundInput value={data.land} onChange={(e)=>update({land:e.target.value})} placeholder="५ एकर" /></Field>
      <Field label="घर"><RoundInput value={data.house} onChange={(e)=>update({house:e.target.value})} placeholder="स्वतःचे" /></Field>
      <Field label="फ्लॅट"><RoundInput value={data.flat} onChange={(e)=>update({flat:e.target.value})} placeholder="1BHK, पुणे" /></Field>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="वाहन"><RoundInput value={data.vehicle} onChange={(e)=>update({vehicle:e.target.value})} placeholder="कार, बाईक" /></Field>
      <Field label="इतर मालमत्ता"><RoundInput value={data.otherAssets} onChange={(e)=>update({otherAssets:e.target.value})} placeholder="—" /></Field>
    </div>
  </div>
)

const StepFamily = ({ data, update }) => {
  const addRow = (key, item) => update({ [key]: [...(data[key]||[]), item] })
  const setRow = (key, i, patch) => { const arr = [...(data[key]||[])]; arr[i] = { ...arr[i], ...patch }; update({ [key]: arr }) }
  const delRow = (key, i) => { const arr = [...(data[key]||[])]; arr.splice(i,1); update({ [key]: arr }) }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="वडिलांचे नाव"><RoundInput value={data.fatherName} onChange={(e)=>update({fatherName:e.target.value})} placeholder="श्री. ..." /></Field>
        <Field label="वडिलांचा व्यवसाय"><RoundInput value={data.fatherOccupation} onChange={(e)=>update({fatherOccupation:e.target.value})} placeholder="शेती / नोकरी" /></Field>
        <Field label="आईचे नाव"><RoundInput value={data.motherName} onChange={(e)=>update({motherName:e.target.value})} placeholder="सौ. ..." /></Field>
        <Field label="आईचा व्यवसाय"><RoundInput value={data.motherOccupation} onChange={(e)=>update({motherOccupation:e.target.value})} placeholder="गृहिणी" /></Field>
      </div>

      <div className="rounded-2xl border border-[#E8D8A8] p-3 bg-[#FFFDF5]">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-[#7A1F1F]">भाऊ</div>
          <Button size="sm" variant="outline" className="rounded-full border-[#E8D8A8]" onClick={()=>addRow('brothers', { name:'', wife:'' })}><Plus className="w-4 h-4 mr-1"/> जोडा</Button>
        </div>
        {(data.brothers||[]).map((b,i)=>(
          <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            <RoundInput value={b.name} onChange={(e)=>setRow('brothers',i,{name:e.target.value})} placeholder="भाऊचे नाव" />
            <div className="flex gap-2">
              <RoundInput value={b.wife} onChange={(e)=>setRow('brothers',i,{wife:e.target.value})} placeholder="वहिनी (Optional)" />
              <Button variant="ghost" size="icon" onClick={()=>delRow('brothers',i)} className="rounded-full text-red-600"><Trash2 className="w-4 h-4"/></Button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#E8D8A8] p-3 bg-[#FFFDF5]">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-[#7A1F1F]">बहीण</div>
          <Button size="sm" variant="outline" className="rounded-full border-[#E8D8A8]" onClick={()=>addRow('sisters', { name:'', husband:'' })}><Plus className="w-4 h-4 mr-1"/> जोडा</Button>
        </div>
        {(data.sisters||[]).map((s,i)=>(
          <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            <RoundInput value={s.name} onChange={(e)=>setRow('sisters',i,{name:e.target.value})} placeholder="बहीणीचे नाव" />
            <div className="flex gap-2">
              <RoundInput value={s.husband} onChange={(e)=>setRow('sisters',i,{husband:e.target.value})} placeholder="मेहुणे (Optional)" />
              <Button variant="ghost" size="icon" onClick={()=>delRow('sisters',i)} className="rounded-full text-red-600"><Trash2 className="w-4 h-4"/></Button>
            </div>
          </div>
        ))}
      </div>

      <Field label="कुटुंबातील सदस्य संख्या"><RoundInput value={data.familyCount} onChange={(e)=>update({familyCount:e.target.value})} placeholder="उदा. ६" /></Field>
    </div>
  )
}

const RELATIVE_LABELS = [
  ['mama', 'मामा'], ['mami', 'मामी'], ['kaka', 'काका'], ['kaku', 'काकू'],
  ['atya', 'आत्या'], ['mavshi', 'मावशी'], ['chulte', 'चुलते'], ['ajoba', 'आजोबा'], ['aji', 'आजी'],
]

const StepRelatives = ({ data, update }) => {
  const setRel = (key, i, val) => {
    const arr = [...(data.relatives?.[key] || [''])]
    arr[i] = val
    update({ relatives: { ...(data.relatives||{}), [key]: arr } })
  }
  const addRel = (key) => update({ relatives: { ...(data.relatives||{}), [key]: [...(data.relatives?.[key]||[]), ''] } })
  const delRel = (key, i) => {
    const arr = [...(data.relatives?.[key] || [])]; arr.splice(i,1)
    update({ relatives: { ...(data.relatives||{}), [key]: arr.length ? arr : [''] } })
  }
  return (
    <div className="space-y-3">
      {RELATIVE_LABELS.map(([key, label]) => (
        <div key={key} className="rounded-2xl border border-[#E8D8A8] p-3 bg-[#FFFDF5]">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-[#7A1F1F]">{label}</div>
            <Button size="sm" variant="outline" className="rounded-full border-[#E8D8A8]" onClick={()=>addRel(key)}><Plus className="w-4 h-4 mr-1"/> जोडा</Button>
          </div>
          {(data.relatives?.[key] || ['']).map((val, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <RoundInput value={val} onChange={(e)=>setRel(key,i,e.target.value)} placeholder={`${label}चे नाव व पत्ता`} />
              <Button variant="ghost" size="icon" onClick={()=>delRel(key,i)} className="rounded-full text-red-600"><Trash2 className="w-4 h-4"/></Button>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

const StepContact = ({ data, update }) => (
  <div className="space-y-3">
    <Field label="पत्ता"><RoundTextarea rows={2} value={data.address} onChange={(e)=>update({address:e.target.value})} placeholder="मु.पो. ..." /></Field>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Field label="गाव"><RoundInput value={data.village} onChange={(e)=>update({village:e.target.value})} placeholder="येलूर" /></Field>
      <Field label="तालुका"><RoundInput value={data.taluka} onChange={(e)=>update({taluka:e.target.value})} placeholder="वाळवा" /></Field>
      <Field label="जिल्हा"><RoundInput value={data.district} onChange={(e)=>update({district:e.target.value})} placeholder="सांगली" /></Field>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="राज्य"><RoundSelect value={data.state} onValueChange={(v)=>update({state:v})} placeholder="निवडा" options={STATES} /></Field>
      <Field label="पिनकोड"><RoundInput value={data.pincode} onChange={(e)=>update({pincode:e.target.value})} placeholder="416313" /></Field>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="मोबाईल नंबर"><RoundInput value={data.mobile} onChange={(e)=>update({mobile:e.target.value})} placeholder="9730702976" /></Field>
      <Field label="दुसरा नंबर"><RoundInput value={data.mobile2} onChange={(e)=>update({mobile2:e.target.value})} placeholder="8600145772" /></Field>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="WhatsApp"><RoundInput value={data.whatsapp} onChange={(e)=>update({whatsapp:e.target.value})} placeholder="9730702976" /></Field>
      <Field label="Email"><RoundInput value={data.email} onChange={(e)=>update({email:e.target.value})} placeholder="you@example.com" /></Field>
    </div>
  </div>
)

const CustomFieldDialog = ({ open, onOpenChange, onAdd }) => {
  const [name, setName] = useState(''); const [value, setValue] = useState('')
  useEffect(() => { if (!open) { setName(''); setValue('') } }, [open])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="text-[#7A1F1F]">नवीन माहिती जोडा</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="शीर्षक"><RoundInput value={name} onChange={(e)=>setName(e.target.value)} placeholder="उदा. आवडता खेळ" /></Field>
          <Field label="माहिती"><RoundInput value={value} onChange={(e)=>setValue(e.target.value)} placeholder="उदा. क्रिकेट" /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={()=>onOpenChange(false)} className="rounded-full">रद्द करा</Button>
          <Button onClick={()=>{ if (!name) return; onAdd({ name, value }); onOpenChange(false) }} className="rounded-full bg-[#B8860B] hover:bg-[#9c7009] text-white">जोडा</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Builder ----------
const Builder = ({ onBack }) => {
  const [data, setData] = useState(emptyData())
  const [step, setStep] = useState(0)
  const [template, setTemplate] = useState('t1')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)
  const [showFinal, setShowFinal] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const bioRef = useRef(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ilb_data')
      if (raw) setData({ ...emptyData(), ...JSON.parse(raw) })
      const t = localStorage.getItem('ilb_template'); if (t) setTemplate(t)
    } catch {}
  }, [])
  useEffect(() => {
    const t = setTimeout(() => { try { localStorage.setItem('ilb_data', JSON.stringify(data)) } catch {} }, 400)
    return () => clearTimeout(t)
  }, [data])
  useEffect(() => { try { localStorage.setItem('ilb_template', template) } catch {} }, [template])

  const update = (patch) => setData((d) => ({ ...d, ...patch }))
  const addCustomField = (cf) => update({ customFields: [...(data.customFields||[]), cf] })
  const delCustomField = (i) => { const arr=[...(data.customFields||[])]; arr.splice(i,1); update({ customFields: arr }) }

  const progress = ((step + 1) / STEPS.length) * 100
  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1))
  const prev = () => setStep((s) => Math.max(0, s - 1))

  const handleDownload = async () => {
    try {
      setDownloading(true)
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')
      const node = bioRef.current
      if (!node) return
      // Ensure fonts are loaded
      if (document.fonts?.ready) { try { await document.fonts.ready } catch {} }
      const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: '#FFFFFF', logging: false })
      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfW = pdf.internal.pageSize.getWidth()
      const pdfH = pdf.internal.pageSize.getHeight()
      const imgW = pdfW
      const imgH = (canvas.height * imgW) / canvas.width
      if (imgH <= pdfH) {
        pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH)
      } else {
        let heightLeft = imgH
        let position = 0
        pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH)
        heightLeft -= pdfH
        while (heightLeft > 0) {
          position = heightLeft - imgH
          pdf.addPage()
          pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH)
          heightLeft -= pdfH
        }
      }
      const nameForFile = [data.firstName, data.lastName].filter(Boolean).join('_') || 'biodata'
      pdf.save(`${nameForFile}_biodata.pdf`)
      toast.success('PDF डाउनलोड झाला')
    } catch (e) {
      console.error(e)
      toast.error('PDF तयार करताना अडचण आली')
    } finally { setDownloading(false) }
  }

  const clearData = () => {
    if (typeof window !== 'undefined' && !window.confirm('सर्व माहिती हटवायची?')) return
    setData(emptyData()); setStep(0); toast.success('रीसेट झाले')
  }

  const currentStep = STEPS[step].key
  const StepBody = useMemo(() => {
    switch (currentStep) {
      case 'god': return <StepGod data={data} update={update} />
      case 'basic': return <StepBasic data={data} update={update} />
      case 'edu': return <StepEdu data={data} update={update} />
      case 'family': return <StepFamily data={data} update={update} />
      case 'relatives': return <StepRelatives data={data} update={update} />
      case 'contact': return <StepContact data={data} update={update} />
      default: return null
    }
  }, [currentStep, data])

  return (
    <div className="min-h-screen bg-[#FBF7EA] font-marathi">
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-[#E8D8A8]">
        <div className="mx-auto max-w-6xl px-3 py-2 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-[#7A1F1F]"><ChevronLeft className="w-5 h-5"/></Button>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-neutral-500">पायरी {step+1}/{STEPS.length}</div>
            <div className="font-semibold text-[#333] leading-tight truncate">{STEPS[step].label}</div>
          </div>
          <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden rounded-full border-[#E8D8A8] text-[#7A1F1F]"><Eye className="w-4 h-4 mr-1"/> प्रीव्ह्यू</Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] p-0 bg-[#FBF7EA]">
              <div className="p-3 border-b border-[#E8D8A8] flex items-center justify-between bg-white">
                <div className="font-semibold text-[#7A1F1F]">लाईव्ह प्रीव्ह्यू</div>
                <div className="flex gap-1">
                  {['t1','t2','t3'].map(t=>(
                    <button key={t} onClick={()=>setTemplate(t)} className={cx('px-2 py-1 text-xs rounded-full border', template===t?'border-[#B8860B] bg-[#FFFDF0] text-[#7A1F1F]':'border-[#E8D8A8] text-neutral-600')}>{t==='t1'?'सुवर्ण':t==='t2'?'मरून':'मिनिमल'}</button>
                  ))}
                </div>
              </div>
              <div className="p-3 overflow-y-auto h-[calc(85vh-56px)]">
                <BiodataView data={data} template={template} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <div className="px-3 pb-2"><Progress value={progress} className="h-1.5 bg-[#F1E7C4] [&>div]:bg-[#B8860B]" /></div>
      </div>

      <div className="mx-auto max-w-6xl px-3 md:px-4 py-4 grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Card className="p-4 md:p-6 border-[#E8D8A8] rounded-2xl bg-white">
            <AnimatePresence mode="wait">
              <motion.div key={currentStep} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.2}}>
                <h2 className="text-xl font-bold text-[#2b2b2b] mb-4">{STEPS[step].label}</h2>
                {StepBody}
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 border-t border-dashed border-[#E8D8A8] pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-[#7A1F1F]">अतिरिक्त माहिती</div>
                <Button variant="outline" size="sm" onClick={()=>setCustomOpen(true)} className="rounded-full border-[#E8D8A8] text-[#7A1F1F]"><Plus className="w-4 h-4 mr-1"/> नवीन माहिती जोडा</Button>
              </div>
              {(data.customFields||[]).length === 0 && <div className="text-xs text-neutral-500">तुम्हाला हवी असलेली कोणतीही अतिरिक्त माहिती जोडता येईल.</div>}
              <div className="space-y-1.5">
                {(data.customFields||[]).map((c,i)=>(
                  <div key={i} className="flex items-center justify-between rounded-xl border border-[#E8D8A8] bg-[#FFFDF5] px-3 py-2">
                    <div className="text-sm"><span className="text-[#7A1F1F] font-semibold">{c.name}:</span> <span className="text-[#333]">{c.value}</span></div>
                    <Button variant="ghost" size="icon" onClick={()=>delCustomField(i)} className="text-red-600"><Trash2 className="w-4 h-4"/></Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-2">
              <Button variant="outline" onClick={prev} disabled={step===0} className="rounded-full border-[#E8D8A8] h-11 px-5"><ChevronLeft className="w-4 h-4 mr-1"/> मागे</Button>
              <Button variant="ghost" onClick={clearData} className="text-neutral-500 hidden sm:inline-flex">रीसेट</Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={next} className="rounded-full bg-[#B8860B] hover:bg-[#9c7009] text-white h-11 px-6">पुढे <ChevronRight className="w-4 h-4 ml-1"/></Button>
              ) : (
                <Button onClick={()=>setShowFinal(true)} className="rounded-full bg-[#7A1F1F] hover:bg-[#5f1616] text-white h-11 px-6"><Sparkles className="w-4 h-4 mr-1"/> बायोडाटा तयार करा</Button>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 hidden lg:block">
          <div className="sticky top-24">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm text-neutral-600">लाईव्ह प्रीव्ह्यू</div>
              <div className="flex gap-1">
                {['t1','t2','t3'].map(t=>(
                  <button key={t} onClick={()=>setTemplate(t)} className={cx('px-2 py-1 text-xs rounded-full border', template===t?'border-[#B8860B] bg-[#FFFDF0] text-[#7A1F1F]':'border-[#E8D8A8] text-neutral-600 bg-white')}>{t==='t1'?'सुवर्ण':t==='t2'?'मरून':'मिनिमल'}</button>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[#E8D8A8] bg-white shadow-sm overflow-hidden">
              <div className="max-h-[calc(100vh-160px)] overflow-y-auto p-3">
                <BiodataView data={data} template={template} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <CustomFieldDialog open={customOpen} onOpenChange={setCustomOpen} onAdd={addCustomField} />

      <Dialog open={showFinal} onOpenChange={setShowFinal}>
        <DialogContent className="max-w-5xl w-[95vw] h-[92vh] p-0 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-[#E8D8A8] flex items-center justify-between bg-white gap-2 flex-wrap">
            <div>
              <div className="font-bold text-[#7A1F1F]">तुमचा बायोडाटा तयार आहे!</div>
              <div className="text-xs text-neutral-500">टेम्पलेट निवडा आणि PDF डाउनलोड करा</div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex gap-1 mr-2">
                {[{k:'t1', label:'सुवर्ण'}, {k:'t2', label:'मरून'}, {k:'t3', label:'मिनिमल'}].map(t=>(
                  <button key={t.k} onClick={()=>setTemplate(t.k)} className={cx('px-3 py-1.5 text-xs rounded-full border font-semibold', template===t.k?'border-[#B8860B] bg-[#FFFDF0] text-[#7A1F1F]':'border-[#E8D8A8] text-neutral-600 bg-white')}>{t.label}</button>
                ))}
              </div>
              <Button onClick={handleDownload} disabled={downloading} className="rounded-full bg-[#B8860B] hover:bg-[#9c7009] text-white">
                <Download className="w-4 h-4 mr-1"/> {downloading? 'तयार होत आहे...' : 'PDF डाउनलोड'}
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-[#FBF7EA]">
            <div className="max-w-3xl mx-auto">
              <div ref={bioRef} className="bg-white">
                <BiodataView data={data} template={template} />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const TemplatesGallery = ({ open, onOpenChange, onSelect }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 flex flex-col">
      <div className="p-3 border-b border-[#E8D8A8] bg-white">
        <div className="font-bold text-[#7A1F1F]">प्रीमियम टेम्पलेट्स</div>
        <div className="text-xs text-neutral-500">कोणतेही टेम्पलेट निवडून बायोडाटा तयार करा</div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 bg-[#FBF7EA]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[{ k: 't1', title: 'पारंपरिक सुवर्ण' },{ k: 't2', title: 'रॉयल मरून' },{ k: 't3', title: 'मिनिमल मॉडर्न' }].map(t=>(
            <div key={t.k} className="bg-white rounded-2xl border border-[#E8D8A8] overflow-hidden">
              <div className="p-3 flex items-center justify-between border-b border-[#E8D8A8]">
                <div className="font-semibold text-[#2b2b2b]">{t.title}</div>
                <Button size="sm" className="rounded-full bg-[#B8860B] hover:bg-[#9c7009] text-white" onClick={()=>onSelect(t.k)}>निवडा</Button>
              </div>
              <div className="p-3"><BiodataView data={samplePreviewData()} template={t.k} /></div>
            </div>
          ))}
        </div>
      </div>
    </DialogContent>
  </Dialog>
)

const App = () => {
  const [view, setView] = useState('landing')
  const [tplOpen, setTplOpen] = useState(false)
  return (
    <>
      <Toaster position="top-center" richColors />
      {view === 'landing' && (
        <>
          <Landing onStart={()=>setView('builder')} onGoTemplates={()=>setTplOpen(true)} />
          <TemplatesGallery open={tplOpen} onOpenChange={setTplOpen} onSelect={()=>{ setTplOpen(false); setView('builder') }} />
        </>
      )}
      {view === 'builder' && <Builder onBack={()=>setView('landing')} />}
    </>
  )
}

export default App
