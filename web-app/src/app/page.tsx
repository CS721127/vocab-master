import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Layers,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

export default function Home() {
  return (
    <div className="landing">
      <header className="site-header">
        <Link href="/" className="brand">
          <BookOpen size={25} />
          Vocab Master
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-5">
          <Link href="/login" className="text-sm font-medium">
            Sign in
          </Link>
          <Link href="/signup" className="button primary compact">
            Get started <ArrowUpRight size={16} />
          </Link>
        </nav>
      </header>
      <main className="landing-main">
        <section className="hero">
          <div className="hero-copy">
            <h1>
              Don’t just learn
              <br />a word.
              <br />
              <em>Make it yours.</em>
            </h1>
            <p className="hero-description">
              Collect words, give them context, and practice until they stay
              with you.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/signup" className="button primary">
                Start your collection <ArrowRight size={18} />
              </Link>
              <Link href="/demo" className="button secondary">
                Explore the demo
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="word-preview">
              <div className="flex justify-between items-center">
                <span>From your collection</span>
                <BookOpen size={22} />
              </div>
              <div className="preview-word">
                serendipity<span>/ˌser.ənˈdɪp.ə.ti/ · noun</span>
              </div>
              <p className="preview-definition">
                The quiet art of finding something beautiful when you weren’t
                looking for it.
              </p>
              <blockquote>
                “Finding that little bookshop was pure serendipity.”
              </blockquote>
              <div className="flex items-center justify-between border-t border-current/15 pt-5 mt-8">
                <span className="text-sm">Everyday discoveries</span>
                <span className="preview-check">
                  <Check size={17} /> Collected
                </span>
              </div>
            </div>
            <div className="practice-note">
              <span className="practice-icon">
                <Check size={21} />
              </span>
              <div>
                <strong>A little practice goes a long way.</strong>
              </div>
            </div>
          </div>
        </section>
        <section className="feature-strip" aria-label="How it works">
          <article>
            <Layers size={23} />
            <div>
              <p>
                Keep your words in lists that make sense to you. Import a CSV or
                start with just one.
              </p>
            </div>
          </article>
          <article>
            <Sparkles size={23} />
            <div>
              <p>
                Add definitions, examples, and your own notes. Use AI to help
                refine your collection.
              </p>
            </div>
          </article>
          <article>
            <BookOpen size={23} />
            <div>
              <p>
                Practice recalling your words, then revisit the ones that need a
                little more attention.
              </p>
            </div>
          </article>
        </section>
      </main>
      <footer className="site-footer">
        <span>Vocab Master</span>
        <a
          href="https://github.com/CS721127/vocab-master"
          target="_blank"
          rel="noreferrer"
        >
          Open source <ArrowUpRight size={14} />
        </a>
      </footer>
    </div>
  );
}
