import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Printer, FilePlus2, ArrowRight } from "lucide-react";

/**
 * Wizard:
 * 1) بيانات العميل
 * 2) البنود
 * 3) المعاينة والطباعة
 *
 * - الهيدر داخل كارد بنفس عرض الجدول (مخفي في الخطوة 3).
 * - ربط ثنائي للهاتف/الضريبة/العنوان/السجل بين العربي والإنجليزي.
 * - في الخطوة 1: لعرض السعر/طلب عميل يظهر فقط الاسم والهاتف. للفاتورة تظهر كل الحقول.
 * - المعاينة: EN يسار / Logo أكبر / AR يمين، وإزالة الإطار عن الميتا وتفاصيل العميل، وQR أكبر.
 * - الأزرار: السابق أحمر، التالي أخضر، بعرض الكارد. (لا يوجد زر تعديل)
 */

const DOC_TYPES = [
  { id: "quote", label: "عرض سعر" },
  { id: "order", label: "طلب عميل" },
  { id: "invoice", label: "فاتورة ضريبية مبسطة" },
];

const LOGO_SRC = "logo.png";
const QR_SRC = "qr.png";

function uid() { return Math.random().toString(36).slice(2, 10); }
function num(v) { const n = parseFloat(String(v)); return isNaN(n) ? 0 : n; }
const toCents = (v) => Math.round(v * 100);
const fromCents = (c) => (c / 100).toFixed(2);
function todayISO() { return new Date().toISOString().slice(0, 10); }
function nextDocNo(prefix) {
  try {
    const key = "rtl_doc_seq_v6";
    const seq = Number(localStorage.getItem(key) || "0");
    localStorage.setItem(key, String(seq + 1));
    return `${prefix}-${new Date().getFullYear()}${String(seq).padStart(4, "0")}`;
  } catch { return `${prefix}-${Date.now()}`; }
}

export default function ThreeStepInvoiceWizard() {
  const [step, setStep] = useState(1);
  const [docType, setDocType] = useState("invoice");

  // ميتا
  const [docNo, setDocNo] = useState("");
  const [docDate, setDocDate] = useState(todayISO());
  const [currency, setCurrency] = useState("SAR");
  const [printedBy] = useState("Abu Kadi");

  // العميل
  const [ar, setAr] = useState({ name: "", phone: "", tax: "", address: "", cr: "" });
  const [en, setEn] = useState({ name: "", phone: "", tax: "", address: "", reg: "" });

  // البنود
  const [rows, setRows] = useState([{ id: uid(), itemNo: "", itemName: "", unit: "", qty: "1", unitPrice: "0" }]);
  function addRow() { setRows((r) => [...r, { id: uid(), itemNo: "", itemName: "", unit: "", qty: "1", unitPrice: "0" }]); }
  function removeRow(id) { setRows((r) => (r.length > 1 ? r.filter((x) => x.id !== id) : r)); }
  function updateRow(id, patch) { setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x))); }

  // خصم
  const [discount, setDiscount] = useState("0");

  // رقم المستند حسب النوع أول مرة
  useEffect(() => {
    if (!docNo) {
      const prefix = docType === "quote" ? "Q" : docType === "order" ? "SO" : "INV";
      setDocNo(nextDocNo(prefix));
    }
  }, [docType]); // eslint-disable-line

  // الحساب
  const totals = useMemo(() => {
    let totalSubCents = 0; let totalVatCents = 0; let totalGrandCents = 0;
    rows.forEach((row) => {
      const price = num(row.unitPrice); const qty = num(row.qty);
      const unitVat = Math.round(price * 0.15 * 100) / 100; // 15%
      const priceCents = Math.round(price * 100); const vatUnitCents = Math.round(unitVat * 100);
      const rowSubCents = priceCents * qty; const rowVatCents = vatUnitCents * qty; const rowGrandCents = rowSubCents + rowVatCents;
      totalSubCents += rowSubCents; totalVatCents += rowVatCents; totalGrandCents += rowGrandCents;
    });
    const discountCents = toCents(num(discount));
    const finalCents = Math.max(totalGrandCents - discountCents, 0);
    return { totalSubCents, totalVatCents, totalGrandCents, discountCents, finalCents };
  }, [rows, discount]);

  const title = useMemo(() => (DOC_TYPES.find((d) => d.id === docType)?.label || "—"), [docType]);

  return (
    <div dir="rtl" className="min-h-screen bg-neutral-100 text-neutral-900 py-6">
      <style>{`@media print{.no-print{display:none!important} th.print-bg{background-color:#c5d6e0!important;-webkit-print-color-adjust:exact;print-color-adjust:exact} .page{box-shadow:none!important}}`}</style>

      <div className="max-w-6xl mx-auto px-4 space-y-4">
        {/* الشريط العلوي لا يظهر في خطوة المعاينة */}
        {step !== 3 && (
          <div className="no-print page bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
            <div className="flex w-full flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-2 bg-white rounded-2xl p-1 border border-neutral-200 shadow-sm">
                {DOC_TYPES.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDocType(d.id)}
                    className={`px-4 h-10 rounded-xl text-sm transition ${docType === d.id ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap md:flex-nowrap items-center gap-2 bg-white rounded-2xl p-1">
                <div className="flex items-center gap-2">
                  <input value={docNo} onChange={(e) => setDocNo(e.target.value)} className="h-10 w-40 rounded-xl border border-neutral-300 px-3 text-center" />
                </div>
                <div className="flex items-center gap-2">
                  <input value={docDate} onChange={(e) => setDocDate(e.target.value)} placeholder="yyyy / m / d" className="h-10 w-44 rounded-xl border border-neutral-300 px-3 text-center" />
                </div>
                <div className="flex items-center gap-2">
                  <input value={currency} onChange={(e) => setCurrency(e.target.value)} className="h-10 w-28 rounded-xl border border-neutral-300 px-3 text-center" />
                </div>
              </div>
            </div>

            <div className="mt-2 flex items-center">
              <div className="ms-auto text-sm text-neutral-500">Step {step} / 3</div>
            </div>
          </div>
        )}

        <div className="page bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
          {step === 1 && (
            <Step1Customer
              docType={docType}
              ar={ar} setAr={setAr}
              en={en} setEn={setEn}
            />
          )}

          {step === 2 && (
            <Step2Items
              rows={rows}
              addRow={addRow}
              removeRow={removeRow}
              updateRow={updateRow}
              discount={discount}
              setDiscount={setDiscount}
            />
          )}

          {step === 3 && (
            <Step3Preview
              title={title}
              docNo={docNo}
              docDate={docDate}
              currency={currency}
              ar={ar}
              en={en}
              rows={rows}
              totals={totals}
              printedBy={printedBy}
              docType={docType}
            />
          )}
        </div>

        {/* أزرار التحكم */}
        <div className="no-print w-full">
          {step < 3 ? (
            // السابق + التالي على كامل العرض
            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                disabled={step === 1}
                onClick={() => setStep((s) => (s > 1 ? s - 1 : s))}
                className="h-12 rounded-xl bg-red-600 text-white flex items-center justify-center gap-2
                           hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRight size={18} /> السابق
              </button>

              <button
                onClick={() => setStep((s) => s + 1)}
                className="h-12 rounded-xl bg-green-600 text-white flex items-center justify-center gap-2
                           hover:bg-green-700"
              >
                التالي <FilePlus2 size={18} />
              </button>
            </div>
          ) : (
            // في الخطوة الثالثة: السابق + طباعة فقط (لا يوجد تعديل)
            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                onClick={() => setStep((s) => (s > 1 ? s - 1 : s))}
                className="h-12 rounded-xl bg-red-600 text-white flex items-center justify-center gap-2 hover:bg-red-700"
              >
                <ArrowRight size={18} /> السابق
              </button>

              <button
                onClick={() => window.print()}
                className="h-12 rounded-xl bg-neutral-900 hover:bg-black text-white flex items-center justify-center gap-2"
              >
                <Printer size={18} /> طباعة
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =================== خطوة 1: بيانات العميل =================== */
function Step1Customer({ docType, ar, setAr, en, setEn }) {
  const isInvoice = docType === "invoice";

  // ربط ثنائي الاتجاه فوري (للحقل النظير)
  const linkFromAr = (keyAr, value) => {
    setAr((a) => ({ ...a, [keyAr]: value }));
    const map = { phone: "phone", tax: "tax", address: "address", cr: "reg" };
    const keyEn = map[keyAr];
    if (keyEn) setEn((e) => ({ ...e, [keyEn]: value }));
  };
  const linkFromEn = (keyEn, value) => {
    setEn((e) => ({ ...e, [keyEn]: value }));
    const map = { phone: "phone", tax: "tax", address: "address", reg: "cr" };
    const keyAr = map[keyEn];
    if (keyAr) setAr((a) => ({ ...a, [keyAr]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* عربي - يمين */}
        <div className="rounded-xl border border-neutral-200 p-4" dir="rtl">
          <h3 className="text-sm font-semibold mb-3 text-right">بيانات العميل (عربي)</h3>

          <FormRow label="الاسم:" labelAlign="right">
            <input className="h-10 w-full rounded-lg border border-neutral-300 px-3"
                   value={ar.name} onChange={(e)=>setAr({...ar, name:e.target.value})}/>
          </FormRow>

          <FormRow label="الهاتف:" labelAlign="right">
            <input className="h-10 w-full rounded-lg border border-neutral-300 px-3"
                   value={ar.phone} onChange={(e)=>linkFromAr("phone", e.target.value)}/>
          </FormRow>

          {isInvoice && (
            <>
              <FormRow label="الرقم الضريبي:" labelAlign="right">
                <input className="h-10 w-full rounded-lg border border-neutral-300 px-3"
                       value={ar.tax} onChange={(e)=>linkFromAr("tax", e.target.value)}/>
              </FormRow>
              <FormRow label="العنوان الوطني:" labelAlign="right">
                <input className="h-10 w-full rounded-lg border border-neutral-300 px-3"
                       value={ar.address} onChange={(e)=>linkFromAr("address", e.target.value)}/>
              </FormRow>
              <FormRow label="السجل التجاري:" labelAlign="right">
                <input className="h-10 w-full rounded-lg border border-neutral-300 px-3"
                       value={ar.cr} onChange={(e)=>linkFromAr("cr", e.target.value)}/>
              </FormRow>
            </>
          )}
        </div>

        {/* English - يسار */}
        <div className="rounded-xl border border-neutral-200 p-4" dir="ltr">
          <h3 className="text-sm font-semibold mb-3 text-left">Customer Details (English)</h3>

          <FormRow label="Name:" labelAlign="left">
            <input className="h-10 w-full rounded-lg border border-neutral-300 px-3"
                   value={en.name} onChange={(e)=>setEn({...en, name:e.target.value})}/>
          </FormRow>

          <FormRow label="Phone:" labelAlign="left">
            <input className="h-10 w-full rounded-lg border border-neutral-300 px-3"
                   value={en.phone} onChange={(e)=>linkFromEn("phone", e.target.value)}/>
          </FormRow>

          {isInvoice && (
            <>
              <FormRow label="Tax No:" labelAlign="left">
                <input className="h-10 w-full rounded-lg border border-neutral-300 px-3"
                       value={en.tax} onChange={(e)=>linkFromEn("tax", e.target.value)}/>
              </FormRow>
              <FormRow label="Address:" labelAlign="left">
                <input className="h-10 w-full rounded-lg border border-neutral-300 px-3"
                       value={en.address} onChange={(e)=>linkFromEn("address", e.target.value)}/>
              </FormRow>
              <FormRow label="Reg. No:" labelAlign="left">
                <input className="h-10 w-full rounded-lg border border-neutral-300 px-3"
                       value={en.reg} onChange={(e)=>linkFromEn("reg", e.target.value)}/>
              </FormRow>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FormRow({ label, children, labelAlign = "right" }) {
  return (
    <div className="grid grid-cols-3 items-center gap-3 py-1.5">
      <div className={`text-sm text-neutral-700 col-span-1 ${labelAlign === "left" ? "text-left" : "text-right"}`}>
        {label}
      </div>
      <div className="col-span-2">{children}</div>
    </div>
  );
}

/* =================== خطوة 2: البنود =================== */
function Step2Items({ rows, addRow, removeRow, updateRow, discount, setDiscount }) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-neutral-300 rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-neutral-50 text-neutral-700">
              <th className="print-bg text-right py-2 px-3 w-10">#</th>
              <th className="print-bg text-right py-2 px-3 w-40">رقم الصنف<br/><small className="text-xs text-neutral-500">Item No</small></th>
              <th className="print-bg text-right py-2 px-3">اسم الصنف<br/><small className="text-xs text-neutral-500">Item Name</small></th>
              <th className="print-bg text-right py-2 px-3 w-32">الوحدة<br/><small className="text-xs text-neutral-500">Unit</small></th>
              <th className="print-bg text-right py-2 px-3 w-28">الكمية<br/><small className="text-xs text-neutral-500">Quantity</small></th>
              <th className="print-bg text-right py-2 px-3 w-36">سعر الوحدة<br/><small className="text-xs text-neutral-500">Unit Price</small></th>
              <th className="print-bg text-right py-2 px-3 w-36">الإجمالي<br/><small className="text-xs text-neutral-500">Total</small></th>
              <th className="print-bg text-right py-2 px-3 w-12">—</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.id} className="border-t border-neutral-200">
                <td className="py-2 px-3">{idx + 1}</td>
                <td className="py-2 px-3"><input value={r.itemNo} onChange={(e)=>updateRow(r.id,{itemNo:e.target.value})} className="h-10 w-full rounded border border-neutral-300 px-3"/></td>
                <td className="py-2 px-3"><input value={r.itemName} onChange={(e)=>updateRow(r.id,{itemName:e.target.value})} className="h-10 w-full rounded border border-neutral-300 px-3"/></td>
                <td className="py-2 px-3 w-32"><input value={r.unit} onChange={(e)=>updateRow(r.id,{unit:e.target.value})} className="h-10 w-full rounded border border-neutral-300 px-3"/></td>
                <td className="py-2 px-3 w-28"><input type="number" min={0} value={r.qty} onChange={(e)=>updateRow(r.id,{qty:e.target.value})} className="h-10 w-full rounded border border-neutral-300 px-3"/></td>
                <td className="py-2 px-3 w-36"><input type="number" min={0} step="0.01" value={r.unitPrice} onChange={(e)=>updateRow(r.id,{unitPrice:e.target.value})} className="h-10 w-full rounded border border-neutral-300 px-3"/></td>
                <td className="py-2 px-3 w-36">{fromCents(Math.round(num(r.unitPrice)*100) * num(r.qty))}</td>
                <td className="py-2 px-3 w-12"><button onClick={()=>removeRow(r.id)} className="h-9 w-9 grid place-items-center rounded border bg-white border-neutral-300 hover:bg-neutral-50"><Trash2 size={16}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={addRow} className="h-10 px-3 rounded-xl border bg-white border-neutral-300 hover:bg-neutral-50"><Plus size={16} className="inline ms-1"/> إضافة صف</button>
      </div>

      <div className="rounded-xl border border-neutral-200 p-4 text-sm max-w-md ms-auto">
        <div className="flex items-center justify-between">
          <div className="text-neutral-700">خصم <span className="text-xs text-neutral-500">Discount</span></div>
          <div className="flex items-center gap-2">
            <input type="number" min={0} step="0.01" value={discount} onChange={(e)=>setDiscount(e.target.value)} className="h-10 w-32 rounded border border-neutral-300 px-3"/>
            <span className="text-neutral-500">SAR</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =================== خطوة 3: المعاينة/الطباعة =================== */
function Step3Preview({ title, docNo, docDate, currency, ar, en, rows, totals, printedBy, docType }) {
  const isInvoice = docType === "invoice";

  return (
    <article className="invoice space-y-5">
      {/* Header: EN يسار / Logo أكبر / AR يمين */}
      <div className="border border-black p-3 bg-white">
        <div className="grid grid-cols-3 gap-2 items-start">
          {/* EN Left */}
          <div className="text-left" dir="ltr">
            <div className="text-rose-600 font-semibold">Road Biker Motorcycles</div>
            <div className="text-xs mt-1"><span className="font-semibold">Address:</span> Hail - Al-Naisiyah Road</div>
            <div className="text-xs"><span className="font-semibold">Tax Number:</span> 301294984200003</div>
            <div className="text-xs"><span className="font-semibold">Phone Number:</span> 0500123007</div>
          </div>
          {/* Logo Center — أكبر */}
          <div className="text-center">
            <img src={LOGO_SRC} alt="Logo" className="inline-block max-h-20 object-contain" />
          </div>
          {/* AR Right */}
          <div className="text-right">
            <div className="text-rose-600 font-semibold">رود بايكر للدراجات النارية</div>
            <div className="text-xs mt-1"><span className="font-semibold">العنوان الرئيسي :</span> حائل - طريق النصيبية</div>
            <div className="text-xs"><span className="font-semibold">الرقم الضريبي :</span> 301294984200003</div>
            <div className="text-xs"><span className="font-semibold">رقم الهاتف :</span> 0500123007</div>
          </div>
        </div>
      </div>

      {/* Meta + Title — بدون إطار */}
      <div className="p-3 bg-white">
        <div className="grid grid-cols-3 items-start">
          {/* AR Right */}
          <div className="text-sm text-right">
            <div><span className="font-semibold">رقم الفاتورة:</span> {docNo}</div>
            <div><span className="font-semibold">تاريخ الفاتورة:</span> {docDate}</div>
            <div><span className="font-semibold">العملة:</span> {currency}</div>
          </div>
          <div className="text-center text-rose-600 font-semibold">{title}</div>
          {/* EN Left */}
          <div className="text-sm" dir="ltr">
            <div><span className="font-semibold">Invoice No:</span> {docNo}</div>
            <div><span className="font-semibold">Invoice Date:</span> {docDate}</div>
            <div><span className="font-semibold">Currency:</span> {currency}</div>
          </div>
        </div>
      </div>

      {/* تفاصيل العميل — بدون إطار */}
      <div className="p-3 bg-white">
        <div className="grid grid-cols-2 gap-6">
          <div className="text-sm space-y-1 text-right">
            <div><span className="font-semibold">الاسم:</span> {ar.name || "—"}</div>
            <div><span className="font-semibold">الهاتف:</span> {ar.phone || "—"}</div>
            {isInvoice && (
              <>
                <div><span className="font-semibold">الرقم الضريبي:</span> {ar.tax || "—"}</div>
                <div><span className="font-semibold">العنوان الوطني:</span> {ar.address || "—"}</div>
                <div><span className="font-semibold">السجل التجاري:</span> {ar.cr || "—"}</div>
              </>
            )}
          </div>
          <div className="text-sm space-y-1" dir="ltr">
            <div><span className="font-semibold">Name:</span> {en.name || "—"}</div>
            <div><span className="font-semibold">Phone:</span> {en.phone || "—"}</div>
            {isInvoice && (
              <>
                <div><span className="font-semibold">Tax No:</span> {en.tax || "—"}</div>
                <div><span className="font-semibold">Address:</span> {en.address || "—"}</div>
                <div><span className="font-semibold">Reg. No:</span> {en.reg || "—"}</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* الجدول + الإجماليات + QR — QR أكبر */}
      <div className="bg-white">
        <table className="w-full text-sm border border-black">
          <thead>
            <tr>
              <th className="print-bg border border-black py-2 px-2 w-10">#</th>
              <th className="print-bg border border-black py-2 px-2 w-40">رقم الصنف<br/><small>Item No</small></th>
              <th className="print-bg border border-black py-2 px-2">اسم الصنف<br/><small>Item Name</small></th>
              <th className="print-bg border border-black py-2 px-2 w-28">الوحدة<br/><small>Unit</small></th>
              <th className="print-bg border border-black py-2 px-2 w-28">الكمية<br/><small>Quantity</small></th>
              <th className="print-bg border border-black py-2 px-2 w-36">سعر الوحدة<br/><small>Unit Price</small></th>
              <th className="print-bg border border-black py-2 px-2 w-36">الإجمالي<br/><small>Total</small></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.id}>
                <td className="border border-black py-2 px-2 text-center">{idx+1}</td>
                <td className="border border-black py-2 px-2 text-center">{r.itemNo || "—"}</td>
                <td className="border border-black py-2 px-2 text-center">{r.itemName || "—"}</td>
                <td className="border border-black py-2 px-2 text-center">{r.unit || "—"}</td>
                <td className="border border-black py-2 px-2 text-center">{r.qty || "0"}</td>
                <td className="border border-black py-2 px-2 text-center">{(num(r.unitPrice)||0).toFixed(2)}</td>
                <td className="border border-black py-2 px-2 text-center">{fromCents(Math.round(num(r.unitPrice)*100) * num(r.qty))}</td>
              </tr>
            ))}

            <tr>
              <td className="border border-black py-2 px-2 text-center" colSpan={4} rowSpan={4}>
                <div className="flex items-center justify-center h-full">
                  <img src={QR_SRC} alt="QR Code" className="max-h-56 object-contain" />
                </div>
              </td>
              <td className="border border-black py-2 px-2 text-center" colSpan={2}>خصم<br/><small>Discount</small></td>
              <td className="border border-black py-2 px-2 text-center">{fromCents(totals.discountCents)}</td>
            </tr>
            <tr>
              <td className="border border-black py-2 px-2 text-center" colSpan={2}>الإجمالي قبل الضريبة<br/><small>Subtotal (before VAT)</small></td>
              <td className="border border-black py-2 px-2 text-center">{fromCents(totals.totalSubCents)}</td>
            </tr>
            <tr>
              <td className="border border-black py-2 px-2 text-center" colSpan={2}>ضريبة القيمة المضافة 15%<br/><small>VAT 15%</small></td>
              <td className="border border-black py-2 px-2 text-center">{fromCents(totals.totalVatCents)}</td>
            </tr>
            <tr>
              <td className="border border-black py-2 px-2 text-center font-semibold" colSpan={2}>الإجمالي النهائي<br/><small>Total (incl. VAT)</small></td>
              <td className="border border-black py-2 px-2 text-center font-semibold">{fromCents(totals.finalCents)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer — EN يسار / AR يمين */}
      <div className="p-3 bg-white">
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div dir="ltr" className="text-left">
            <span className="font-semibold">Printed by:</span> {printedBy}<br/>
            <span className="font-semibold">Invoice date:</span> {docDate}<br/>
            <span className="font-semibold">Invoice time:</span> {new Date().toTimeString().split(" ")[0]}
            <div className="text-rose-600 mt-2">
              Warranty covers manufacturing defects of the engine only for 6 months from the invoice date.
            </div>
          </div>
          <div className="text-right">
            <span className="font-semibold">طبع بواسطة المستخدم :</span> أبو كادي<br/>
            <span className="font-semibold">تاريخ الفاتورة :</span> {docDate}<br/>
            <span className="font-semibold">وقت الفاتورة :</span> {new Date().toTimeString().split(" ")[0]}
            <div className="text-rose-600 mt-2">
              يغطي الضمان عيوب التصنيع على المكينة فقط ولمدة 6 اشهر من تاريخ الفاتورة
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
