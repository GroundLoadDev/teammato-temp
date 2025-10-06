import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LegalSection {
  id: string;
  title: string;
  content: string[];
}

interface LegalDocumentProps {
  title: string;
  effectiveDate: string;
  introduction: string;
  sections: LegalSection[];
  downloadFilename?: string;
}

export default function LegalDocument({
  title,
  effectiveDate,
  introduction,
  sections,
  downloadFilename = "document.txt",
}: LegalDocumentProps) {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id || "");

  const handleDownload = () => {
    let content = `${title}\n\nEffective Date: ${effectiveDate}\n\n${introduction}\n\n`;
    
    sections.forEach((section) => {
      content += `${section.title}\n\n`;
      section.content.forEach((paragraph) => {
        content += `${paragraph}\n\n`;
      });
    });

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = downloadFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <a href="/" className="text-2xl font-semibold text-foreground hover:text-emerald-600 transition-colors">
                Teammato
              </a>
              <p className="text-sm text-muted-foreground mt-1">{title}</p>
            </div>
            <Button variant="outline" asChild size="sm" data-testid="button-return-to-site">
              <a href="/">Return to Site</a>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Navigation - 30% */}
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="lg:sticky lg:top-28">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-semibold text-sm">Contents</h3>
                </div>
                <nav className="space-y-1">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                        activeSection === section.id
                          ? "bg-emerald-50 text-emerald-700 font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                      data-testid={`nav-${section.id}`}
                    >
                      {section.title}
                    </button>
                  ))}
                </nav>
              </Card>
            </div>
          </aside>

          {/* Content Area - 70% */}
          <main className="lg:col-span-8 xl:col-span-9">
            <Card className="p-8 lg:p-12">
              {/* Document Header */}
              <div className="mb-8 pb-8 border-b">
                <h1 className="text-3xl lg:text-4xl font-bold mb-3">{title}</h1>
                <p className="text-sm text-muted-foreground mb-4">
                  Effective Date: {effectiveDate}
                </p>
                <div className="prose prose-sm max-w-none">
                  <p className="text-foreground/90 leading-relaxed">{introduction}</p>
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-12">
                {sections.map((section) => (
                  <section
                    key={section.id}
                    id={`section-${section.id}`}
                    className="scroll-mt-28"
                    data-testid={`section-${section.id}`}
                  >
                    <h2 className="text-xl lg:text-2xl font-semibold mb-4 text-foreground">
                      {section.title}
                    </h2>
                    <div className="prose prose-sm max-w-none space-y-4">
                      {section.content.map((paragraph, idx) => (
                        <p
                          key={idx}
                          className="text-foreground/80 leading-relaxed"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </section>
                ))}
              </div>

              {/* Download CTA */}
              <div className="mt-12 pt-8 border-t">
                <Card className="p-6 bg-emerald-50 border-emerald-200">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-emerald-900 mb-1">
                        Download Complete Document
                      </h3>
                      <p className="text-sm text-emerald-700">
                        Get the full {title.toLowerCase()} as a text file for your records.
                      </p>
                    </div>
                    <Button
                      onClick={handleDownload}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      data-testid="button-download-document"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </Card>
              </div>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
