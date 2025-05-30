## 🚀 Task: Smart Invoice Payment via QR Code Support

### 🌐 Goal

Enable the 137Docs system to support invoice payments through QR codes, either by:

* Reusing existing QR codes from uploaded invoices, or
* Generating QR codes based on parsed invoice data (IBAN, amount, reference, etc.)

This allows users to scan and pay invoices easily using their banking app, while the system tracks the payment status.

---

## ✅ Deliverables

### 1. **QR Code Detection and Display (Phase 1)**

* Detect embedded QR codes from invoices (if available via ColVision)
* Extract payment data
* Display the QR code in the invoice view
* Allow user to mark invoice as paid manually

### 2. **QR Code Generation (Phase 2)**

* If no QR is found:

  * Generate a valid SEPA QR (EU) or Swiss QR (CH) from invoice data
  * Display as scannable QR code with matching payment fields below

### 3. **Payment Status Tracking**

* Let users manually mark invoice as paid and store:

  * `paid_at`
  * `payment_method`
  * Optional receipt or confirmation doc

---

## 🔖 JSON Schema: Payment Metadata

```json
{
  "payment": {
    "status": "unpaid" | "paid",
    "paid_at": "2025-05-25",
    "payment_method": "qr-swiss" | "qr-epc" | "manual",
    "iban": "CH93 0076 2011 6238 5295 7",
    "amount": 423.50,
    "currency": "CHF",
    "creditor": "Technopark Immobilien AG",
    "reference": "INV-2025-0452",
    "qr_code_data": "string",
    "proof_doc_id": "doc_abc123" // optional
  }
}
```

---

## ✨ QR Code Format: EPC SEPA QR (EU Standard)

Format example for SEPA EPC:

```
BCD
001
1
SCT
BICCODE
Creditor Name
IBAN123456789
EUR423.50

INV-2025-0452
```

* Use `qrcode-generator` or `qrcode.react` to generate from this string.

---

### Bonus: Swiss QR-Bill Format

* Optional support if `currency == CHF`
* See: [Swiss QR-Bill Format](https://www.paymentstandards.ch/en/shared/overview/qr-bill.html)

---

## 🚪 Optional Controls

* Add setting in module config: `qr_generation_enabled: true`
* Let user choose to auto-generate or not
* Support upload of receipt image / PDF for later auto-match

---

## ♻ Next Steps

* Add `payment` block to invoice schema
* Create `QRPanel.tsx` component (can use ShadCN `Card`)
* Scan for embedded QR → fallback to generator if missing
* Add manual confirmation modal with calendar/date picker

