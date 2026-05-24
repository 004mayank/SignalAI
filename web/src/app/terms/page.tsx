import Link from "next/link";
import { Shell } from "@/components/shell";

export default function TermsPage() {
  return (
    <Shell sidebarFilters={false}>
      <div className="mx-auto max-w-2xl py-12">

        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 mb-2">Legal</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Terms of Service</h1>
          <p className="mt-2 text-sm text-zinc-500">Effective date: January 1, 2026</p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-zinc-400">

          <section>
            <h2 className="mb-3 text-base font-semibold text-zinc-200">1. About SignalAI</h2>
            <p>
              SignalAI is an AI-powered signal aggregator that surfaces, scores, and summarises
              developments in artificial intelligence from public sources including research papers,
              GitHub, developer blogs, and community forums. The platform is operated by Mayank Malviya
              (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;).
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-zinc-200">2. Acceptance of Terms</h2>
            <p>
              By accessing or using SignalAI (the &ldquo;Service&rdquo;), you agree to be bound by these
              Terms of Service. If you do not agree, please stop using the Service. We may update these
              terms from time to time; continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-zinc-200">3. Informational Purpose Only</h2>
            <p>
              All content on SignalAI, including signal scores, summaries, trend analyses, and newsletter
              issues, is provided for informational and educational purposes only. Nothing on the Service
              constitutes financial, investment, legal, or professional advice. You should not make
              decisions based solely on content provided by SignalAI.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-zinc-200">4. AI-Generated Content</h2>
            <p>
              Much of the content on SignalAI is generated or summarised using large language models
              (LLMs). AI-generated summaries may contain inaccuracies, omissions, or misrepresentations
              of the underlying source material. We recommend reading original sources before acting on
              any information. We make no warranty as to the accuracy, completeness, or timeliness of
              AI-generated content.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-zinc-200">5. Third-Party Content</h2>
            <p>
              SignalAI aggregates publicly available content from third-party sources. We do not claim
              ownership of the original articles, papers, or repositories we link to. All trademarks,
              logos, and brand names referenced are the property of their respective owners. Links to
              external sites are provided for convenience; we have no control over their content and
              assume no responsibility for them.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-zinc-200">6. Newsletter Subscription</h2>
            <p>
              When you subscribe to the SignalAI Weekly newsletter, you provide your email address
              solely for the purpose of receiving weekly AI signal digests. We use Beehiiv to deliver
              newsletters. You can unsubscribe at any time using the link in any newsletter email.
              We will not sell or share your email address with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-zinc-200">7. Intellectual Property</h2>
            <p>
              The SignalAI platform, its design, scoring algorithms, and original editorial content
              are owned by or licensed to us. You may not reproduce, distribute, or create derivative
              works from our original content without written permission. Summaries that derive from
              third-party sources remain subject to the intellectual property rights of those sources.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-zinc-200">8. Prohibited Use</h2>
            <p>You agree not to:</p>
            <ul className="mt-2 space-y-1.5 list-none">
              {[
                "Scrape, crawl, or systematically download content from the Service at scale",
                "Use the Service in any way that violates applicable laws or regulations",
                "Attempt to reverse-engineer the signal scoring algorithm or underlying models",
                "Impersonate SignalAI or its operators in any communication",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-zinc-200">9. Disclaimer of Warranties</h2>
            <p>
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranty of any kind,
              express or implied, including but not limited to warranties of merchantability, fitness
              for a particular purpose, or non-infringement. We do not warrant that the Service will be
              uninterrupted, error-free, or free of harmful components.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-zinc-200">10. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, SignalAI and its operators shall not be liable
              for any indirect, incidental, special, consequential, or punitive damages arising from
              your use of, or inability to use, the Service, even if advised of the possibility of
              such damages. Our total liability for any claim shall not exceed the amount you paid
              to use the Service in the preceding 12 months (which, for a free service, is zero).
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-zinc-200">11. Governing Law</h2>
            <p>
              These Terms are governed by the laws of India, without regard to its conflict-of-law
              provisions. Any disputes shall be resolved in the competent courts of India.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-zinc-200">12. Contact</h2>
            <p>
              Questions about these Terms? Email us at{" "}
              <a
                href="mailto:mayankmalviya21@gmail.com"
                className="text-cyan-400 hover:underline"
              >
                mayankmalviya21@gmail.com
              </a>
              .
            </p>
          </section>

        </div>

        <div className="mt-12 border-t border-white/5 pt-6">
          <Link href="/" className="text-xs text-zinc-600 hover:text-zinc-400 transition">
            Back to SignalAI
          </Link>
        </div>
      </div>
    </Shell>
  );
}
