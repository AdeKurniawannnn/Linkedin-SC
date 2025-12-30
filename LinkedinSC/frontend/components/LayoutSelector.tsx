"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sidebar, Tabs, SplitVertical, Sparkle } from "@phosphor-icons/react";

interface LayoutOption {
  title: string;
  description: string;
  features: string[];
  href: string;
  icon: React.ReactNode;
  gradient: string;
  recommended?: boolean;
}

const layoutOptions: LayoutOption[] = [
  {
    title: "Original Layout",
    description: "Vertikal layout klasik dengan form di tengah",
    features: [
      "Simple & familiar",
      "Scrolling vertical",
      "Semua elemen visible sekaligus",
    ],
    href: "/query-builder",
    icon: <SplitVertical className="h-6 w-6" weight="duotone" />,
    gradient: "from-gray-400 to-gray-600",
  },
  {
    title: "Sidebar Layout",
    description: "Form sticky di kiri, hasil di kanan - multitasking friendly",
    features: [
      "Form selalu terlihat",
      "Hasil full-width di kanan",
      "Cocok untuk layar lebar",
      "Quick stats di sidebar",
    ],
    href: "/query-builder/sidebar",
    icon: <Sidebar className="h-6 w-6" weight="duotone" />,
    gradient: "from-blue-500 to-indigo-600",
    recommended: true,
  },
  {
    title: "Tabs Layout",
    description: "Pisahkan config dan results dengan tabs - clean & focused",
    features: [
      "Fokus satu task",
      "Auto-switch ke results",
      "Clean interface",
      "Hemat space",
    ],
    href: "/query-builder/tabs",
    icon: <Tabs className="h-6 w-6" weight="duotone" />,
    gradient: "from-purple-500 to-pink-600",
  },
  {
    title: "Dark Bento Grid",
    description: "Asymmetric bento grid layout dengan dark mode futuristic",
    features: [
      "Dark mode dengan gradient purple",
      "Asymmetric bento grid layout",
      "No stats cards, no buttons",
      "Minimal & clean design",
      "Completely different layout",
    ],
    href: "/query-builder/split",
    icon: <SplitVertical className="h-6 w-6 rotate-45" weight="duotone" />,
    gradient: "from-slate-700 via-purple-700 to-slate-700",
  },
];

export function LayoutSelector() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {layoutOptions.map((layout) => (
        <Card
          key={layout.href}
          className="relative overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-gray-300"
        >
          {layout.recommended && (
            <div className="absolute top-4 right-4 z-10">
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                <Sparkle className="mr-1 h-3 w-3" weight="fill" />
                Recommended
              </Badge>
            </div>
          )}

          <CardHeader>
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${layout.gradient} flex items-center justify-center text-white mb-3`}>
              {layout.icon}
            </div>
            <CardTitle className="text-xl">{layout.title}</CardTitle>
            <CardDescription className="text-sm">
              {layout.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Features List */}
            <ul className="space-y-2">
              {layout.features.map((feature, idx) => (
                <li key={idx} className="flex items-start text-sm text-gray-600">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <Link href={layout.href} className="block">
              <Button
                className={`w-full bg-gradient-to-r ${layout.gradient} hover:opacity-90 transition-opacity`}
              >
                Coba Layout Ini
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
