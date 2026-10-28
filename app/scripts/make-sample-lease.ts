// Generates public/sample-lease.pdf: a fictional NYC lease with three planted problems
// (2x deposit, $150 late fee after 1 day, tenant pays the landlord's broker fee).
import { writeFileSync } from "node:fs";
import { PDFDocument, StandardFonts } from "pdf-lib";

const sections: [string, string][] = [
  ["", "RESIDENTIAL LEASE AGREEMENT"],
  ["", "SAMPLE DOCUMENT FOR DEMONSTRATION. The parties named below are fictional."],
  [
    "1. Parties.",
    "This Lease is made on September 15, 2025 between Maple Leaf Realty Holdings LLC (\"Landlord\"), c/o Maple Leaf Management, 400 Grand Concourse, Suite 210, Bronx, NY 10451, (718) 555-0142, leasing@mapleleafmgmt.example, and Jordan Rivera (\"Tenant\").",
  ],
  ["2. Premises.", "Landlord leases to Tenant Apartment 4B at 1520 Sedgwick Avenue, Bronx, NY 10453 (the \"Apartment\")."],
  ["3. Term.", "The term of this Lease begins on October 1, 2025 and ends on September 30, 2026."],
  [
    "4. Rent.",
    "Tenant shall pay monthly rent of $2,500.00, due in advance on the first (1st) day of each month, payable to Landlord at the address above or through Landlord's online portal.",
  ],
  [
    "5. Late Charges.",
    "If any rent is not received by the second (2nd) day of the month, Tenant shall pay a late charge of $150.00 for each late payment, as additional rent.",
  ],
  [
    "6. Security Deposit.",
    "Upon signing, Tenant shall deposit with Landlord the sum of $5,000.00 as security for Tenant's performance of this Lease. Landlord may apply the deposit to any unpaid rent or to the cost of repairing damage beyond normal wear and tear.",
  ],
  [
    "7. Broker Fee.",
    "Tenant shall pay the broker fee of fifteen percent (15%) of the first year's annual rent to Landlord's agent, Concourse Leasing Group, at lease signing.",
  ],
  [
    "8. Utilities.",
    "Tenant shall pay for electricity and internet service. Landlord shall supply heat, hot water, and cold water.",
  ],
  [
    "9. Repairs.",
    "Landlord shall make repairs to the Apartment and building systems within a reasonable time after Tenant's written notice. Tenant shall repair any damage caused by Tenant or Tenant's guests.",
  ],
  [
    "10. Entry.",
    "Landlord may enter the Apartment at reasonable times, on reasonable notice, to inspect, make repairs, or show the Apartment, and at any time without notice in an emergency.",
  ],
  [
    "11. Ending the Lease.",
    "Tenant shall give Landlord written notice at least sixty (60) days before the end of the term if Tenant does not intend to renew. At the end of the term Tenant shall return the Apartment broom-clean and in good condition, ordinary wear and tear excepted.",
  ],
  ["12. Pets.", "No pets are permitted without Landlord's prior written consent."],
  [
    "13. Subletting.",
    "Tenant may not sublet or assign the Apartment without Landlord's written consent, which shall not be unreasonably withheld.",
  ],
  ["14. Entire Agreement.", "This Lease is the entire agreement between the parties and may be changed only in writing."],
  ["", "Landlord: Maple Leaf Realty Holdings LLC      By: ______________________   Date: 09/15/2025"],
  ["", "Tenant: Jordan Rivera                         Signature: _______________   Date: 09/15/2025"],
];

async function main() {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const size = 11;
  const margin = 64;
  let page = pdf.addPage([612, 792]);
  let y = 792 - margin;
  const width = 612 - margin * 2;

  const line = (text: string, f = font, s = size) => {
    if (y < margin) {
      page = pdf.addPage([612, 792]);
      y = 792 - margin;
    }
    page.drawText(text, { x: margin, y, size: s, font: f });
    y -= s * 1.45;
  };

  const wrap = (text: string, f = font) => {
    const words = text.split(" ");
    let current = "";
    for (const w of words) {
      const next = current ? `${current} ${w}` : w;
      if (f.widthOfTextAtSize(next, size) > width) {
        line(current, f);
        current = w;
      } else current = next;
    }
    if (current) line(current, f);
  };

  for (const [heading, body] of sections) {
    if (!heading && body.startsWith("RESIDENTIAL")) {
      line(body, bold, 15);
      y -= 6;
      continue;
    }
    if (heading) line(heading, bold);
    wrap(body);
    y -= 8;
  }

  writeFileSync("public/sample-lease.pdf", await pdf.save());
  console.log("wrote public/sample-lease.pdf");
}

main();
