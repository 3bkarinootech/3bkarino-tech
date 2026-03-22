import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Zap, Brain, TrendingUp, Mail, Phone, MapPin, Send } from "lucide-react";
import { useState } from "react";

/**
 * 3BKARiNO Tech - Digital Marketing & AI Services Portfolio
 * Design Philosophy: Bold Modern - Energetic, innovative, and professional
 * Color Scheme: Navy (#1F3A5F), Yellow (#FFD700), White
 * Typography: Poppins (headings), Inter (body)
 */

export default function Home() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-white text-navy-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center">
              <span className="text-navy-900 font-bold text-lg">3B</span>
            </div>
            <span className="font-bold text-xl text-navy-900">عبقرينو تك</span>
          </div>
          <div className="hidden md:flex gap-8">
            <a href="#services" className="text-navy-900 hover:text-yellow-500 transition-colors font-medium">
              الخدمات
            </a>
            <a href="#portfolio" className="text-navy-900 hover:text-yellow-500 transition-colors font-medium">
              الأعمال
            </a>
            <a href="#contact" className="text-navy-900 hover:text-yellow-500 transition-colors font-medium">
              تواصل معنا
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url('https://d2xsxph8kpxj0f.cloudfront.net/310519663462992416/e7EuBTeFKJLgqDobHomBKT/hero-bg-HhJMyfYsJK4N7cqh8bgY4r.webp')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-900/80 to-navy-900/40" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                  نحول أفكارك إلى <span className="text-yellow-400">نتائج</span>
                </h1>
                <p className="text-xl text-gray-200 leading-relaxed">
                  وكالة تسويق رقمي متخصصة في إدارة السوشيال ميديا والذكاء الاصطناعي والتسويق الاستراتيجي
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  className="bg-yellow-400 hover:bg-yellow-500 text-navy-900 font-bold px-8 py-6 text-lg rounded-lg transition-all transform hover:scale-105"
                  onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                >
                  ابدأ معنا الآن
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 font-bold px-8 py-6 text-lg rounded-lg"
                >
                  تعرف أكثر
                </Button>
              </div>

              <div className="flex gap-8 pt-8">
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-yellow-400">50+</p>
                  <p className="text-gray-300">مشروع ناجح</p>
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-yellow-400">100%</p>
                  <p className="text-gray-300">رضا العملاء</p>
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-yellow-400">5+</p>
                  <p className="text-gray-300">سنوات خبرة</p>
                </div>
              </div>
            </div>

            <div className="relative hidden md:block">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-400 rounded-full opacity-20 blur-3xl" />
              <div className="absolute top-40 -left-20 w-48 h-48 bg-yellow-300 rounded-full opacity-10 blur-3xl" />
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663462992416/e7EuBTeFKJLgqDobHomBKT/hero-bg-HhJMyfYsJK4N7cqh8bgY4r.webp"
                alt="Hero"
                className="relative z-10 rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-navy-900">
              خدماتنا <span className="text-yellow-400">المتميزة</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              نقدم حلولاً متكاملة لتعزيز وجودك الرقمي وتحقيق أهدافك التسويقية
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Social Media Service */}
            <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 overflow-hidden">
              <div className="relative h-48 bg-gradient-to-br from-navy-900 to-navy-800 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <img
                    src="https://d2xsxph8kpxj0f.cloudfront.net/310519663462992416/e7EuBTeFKJLgqDobHomBKT/social-media-service-jXPK8CBYHwUC43hTTUqKV7.webp"
                    alt="Social Media"
                    className="w-full h-full object-cover"
                  />
                </div>
                <Zap className="w-16 h-16 text-yellow-400 relative z-10" />
              </div>
              <div className="p-6 space-y-4">
                <h3 className="text-2xl font-bold text-navy-900">إدارة السوشيال ميديا</h3>
                <p className="text-gray-600 leading-relaxed">
                  ندير حساباتك على جميع منصات التواصل الاجتماعي بكفاءة واحترافية عالية
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                    إنشاء محتوى جذاب
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                    إدارة التفاعلات
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                    تحليل الأداء
                  </li>
                </ul>
              </div>
            </Card>

            {/* AI Service */}
            <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 overflow-hidden">
              <div className="relative h-48 bg-gradient-to-br from-navy-900 to-navy-800 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <img
                    src="https://d2xsxph8kpxj0f.cloudfront.net/310519663462992416/e7EuBTeFKJLgqDobHomBKT/ai-service-mTsVkcDS6dZt93YXrcDNua.webp"
                    alt="AI"
                    className="w-full h-full object-cover"
                  />
                </div>
                <Brain className="w-16 h-16 text-yellow-400 relative z-10" />
              </div>
              <div className="p-6 space-y-4">
                <h3 className="text-2xl font-bold text-navy-900">حلول الذكاء الاصطناعي</h3>
                <p className="text-gray-600 leading-relaxed">
                  نستخدم تقنيات الذكاء الاصطناعي لتحسين كفاءة عملياتك التسويقية
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                    أتمتة التسويق
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                    تحليل البيانات
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                    توقعات الأداء
                  </li>
                </ul>
              </div>
            </Card>

            {/* Marketing Service */}
            <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 overflow-hidden">
              <div className="relative h-48 bg-gradient-to-br from-navy-900 to-navy-800 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <img
                    src="https://d2xsxph8kpxj0f.cloudfront.net/310519663462992416/e7EuBTeFKJLgqDobHomBKT/marketing-service-oHHRMceZVfLuq4thURQXsQ.webp"
                    alt="Marketing"
                    className="w-full h-full object-cover"
                  />
                </div>
                <TrendingUp className="w-16 h-16 text-yellow-400 relative z-10" />
              </div>
              <div className="p-6 space-y-4">
                <h3 className="text-2xl font-bold text-navy-900">التسويق الاستراتيجي</h3>
                <p className="text-gray-600 leading-relaxed">
                  نطور استراتيجيات تسويقية مخصصة لتحقيق أهدافك وزيادة عائد الاستثمار
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                    تحليل السوق
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                    استراتيجية المحتوى
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                    قياس النتائج
                  </li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-navy-900">
              أعمالنا <span className="text-yellow-400">السابقة</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              نماذج من المشاريع الناجحة التي قدمناها لعملائنا
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((item) => (
              <Card
                key={item}
                className="group overflow-hidden border-0 hover:shadow-xl transition-all duration-300"
              >
                <div className="relative h-64 bg-gradient-to-br from-navy-900 to-navy-800 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl">
                    مشروع {item}
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  <h3 className="text-xl font-bold text-navy-900">عميل {item}</h3>
                  <p className="text-gray-600">
                    زيادة المبيعات بنسبة 150% خلال 3 أشهر من خلال استراتيجية تسويقية متكاملة
                  </p>
                  <div className="flex gap-2 flex-wrap pt-2">
                    <span className="bg-yellow-100 text-navy-900 px-3 py-1 rounded-full text-sm font-medium">
                      سوشيال ميديا
                    </span>
                    <span className="bg-yellow-100 text-navy-900 px-3 py-1 rounded-full text-sm font-medium">
                      تسويق
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-navy-900">
                تواصل <span className="text-yellow-400">معنا</span>
              </h2>
              <p className="text-xl text-gray-600">
                لا تتردد في التواصل معنا لمناقشة مشروعك القادم
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card className="border-0 p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="font-bold text-navy-900 mb-2">البريد الإلكتروني</h3>
                <p className="text-gray-600">info@3bkarino.com</p>
              </Card>

              <Card className="border-0 p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="font-bold text-navy-900 mb-2">الهاتف</h3>
                <p className="text-gray-600">+966 50 123 4567</p>
              </Card>

              <Card className="border-0 p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="font-bold text-navy-900 mb-2">الموقع</h3>
                <p className="text-gray-600">الرياض، المملكة العربية السعودية</p>
              </Card>
            </div>

            {/* Contact Form */}
            <Card className="border-0 p-8 bg-gradient-to-br from-navy-900 to-navy-800 text-white">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">الاسم</label>
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="أدخل اسمك"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">البريد الإلكتروني</label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="أدخل بريدك الإلكتروني"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">الرسالة</label>
                  <Textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="أخبرنا عن مشروعك"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-32"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-navy-900 font-bold py-6 text-lg rounded-lg transition-all transform hover:scale-105"
                >
                  إرسال الرسالة
                  <Send className="ml-2 w-5 h-5" />
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
                  <span className="text-navy-900 font-bold">3B</span>
                </div>
                <span className="font-bold text-lg">عبقرينو تك</span>
              </div>
              <p className="text-gray-400 text-sm">
                وكالة تسويق رقمي متخصصة في تحويل الأفكار إلى نتائج ملموسة
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-yellow-400">الخدمات</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#services" className="hover:text-yellow-400 transition-colors">إدارة السوشيال ميديا</a></li>
                <li><a href="#services" className="hover:text-yellow-400 transition-colors">حلول الذكاء الاصطناعي</a></li>
                <li><a href="#services" className="hover:text-yellow-400 transition-colors">التسويق الاستراتيجي</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-yellow-400">الروابط</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#services" className="hover:text-yellow-400 transition-colors">الخدمات</a></li>
                <li><a href="#portfolio" className="hover:text-yellow-400 transition-colors">الأعمال</a></li>
                <li><a href="#contact" className="hover:text-yellow-400 transition-colors">تواصل معنا</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-yellow-400">تابعنا</h4>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-yellow-400 hover:text-navy-900 transition-all">
                  f
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-yellow-400 hover:text-navy-900 transition-all">
                  𝕏
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-yellow-400 hover:text-navy-900 transition-all">
                  in
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 عبقرينو تك. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
