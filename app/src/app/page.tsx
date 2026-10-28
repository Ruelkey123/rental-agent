import { Disclaimer } from "@/components/Disclaimer";
import { Shell } from "@/components/Shell";
import { UploadLease } from "@/components/UploadLease";

export default function Home() {
  return (
    <Shell>
      <section className="pt-10 pb-12">
        <h1 className="max-w-[18ch] text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl">
          Brokers help you sign. Rental Agent stays.
        </h1>
        <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-muted">
          Upload your NYC lease. Rental Agent marks up anything that breaks New York law, keeps your important dates,
          checks your building&rsquo;s violation record, and helps you push back when your landlord tries to keep your
          deposit.
        </p>
      </section>

      <UploadLease />

      <section className="mt-14">
        <h2 className="font-semibold">What it checks</h2>
        <ul className="mt-3 space-y-2 font-serif text-[1.05rem] leading-relaxed">
          <li>
            A deposit over one month&rsquo;s rent, <span className="marked">which New York doesn&rsquo;t allow</span>.
          </li>
          <li>Late fees above $50, or charged before rent is 5 days late.</li>
          <li>A broker fee you shouldn&rsquo;t be paying under the FARE Act.</li>
          <li>Whether your landlord met the 14-day deadline to explain deposit deductions.</li>
        </ul>
      </section>

      <Disclaimer />
    </Shell>
  );
}
