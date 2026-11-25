import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Droplet,
  Heart,
  HeartHandshake,
  ShieldCheck,
  Activity,
  Clock,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Calendar,
  Users,
  Building2,
  Sparkles,
  Phone,
  Mail,
  ChevronRight,
  Menu,
  X,
  Award,
  AlertCircle,
  FileText,
  Zap,
  Check,
  Stethoscope,
  Info
} from 'lucide-react';

const BLOOD_COMPATIBILITY = {
  'O-': {
    give: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    receive: ['O-'],
    rarity: 'Universal Red Cell Donor',
    note: 'Critically needed in trauma emergencies when the patient blood type is not yet known.'
  },
  'O+': {
    give: ['O+', 'A+', 'B+', 'AB+'],
    receive: ['O+', 'O-'],
    rarity: 'Most Requested Blood Group',
    note: 'Accounts for nearly 38% of hospital transfusion demand across Indian medical centers.'
  },
  'A-': {
    give: ['A-', 'A+', 'AB-', 'AB+'],
    receive: ['A-', 'O-'],
    rarity: 'Rare Negative Group',
    note: 'Essential for matching surgical patients with negative Rh factors.'
  },
  'A+': {
    give: ['A+', 'AB+'],
    receive: ['A+', 'A-', 'O+', 'O-'],
    rarity: 'High Demand Group',
    note: 'Widely needed for cancer chemotherapy support, thalassaemia, and surgical procedures.'
  },
  'B-': {
    give: ['B-', 'B+', 'AB-', 'AB+'],
    receive: ['B-', 'O-'],
    rarity: 'Rare Negative Group',
    note: 'Vital for specialized pediatric surgeries and emergency transfusions.'
  },
  'B+': {
    give: ['B+', 'AB+'],
    receive: ['B+', 'B-', 'O+', 'O-'],
    rarity: 'Very Common in India (~32%)',
    note: 'One of the most frequently required blood groups in North Indian trauma centers.'
  },
  'AB-': {
    give: ['AB-', 'AB+'],
    receive: ['AB-', 'A-', 'B-', 'O-'],
    rarity: 'Rarest Blood Group (<1%)',
    note: 'Universal plasma donor; plasma can be safely administered to any patient regardless of type.'
  },
  'AB+': {
    give: ['AB+'],
    receive: ['All Blood Groups (Universal Recipient)'],
    rarity: 'Universal Red Cell Recipient',
    note: 'Can receive red blood cells from any donor, and serves as an ideal plasma donor for all.'
  }
};

export const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('O+');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentCompat = BLOOD_COMPATIBILITY[selectedGroup] || BLOOD_COMPATIBILITY['O+'];

  return (
    <div className="min-h-screen bg-[#F8F7F5] text-[#475569] font-sans selection:bg-[#F1DDE3] selection:text-[#3B0D20]">
      {/* =========================================================================
          1. PUBLIC STICKY NAVBAR (Deep Plum #681B3F - Inspired by Screenshot 1)
         ========================================================================= */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#681B3F]/98 backdrop-blur-md shadow-md py-2.5 border-b border-[#521330]'
            : 'bg-[#681B3F] py-3.5 border-b border-[#521330]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo & Title */}
          <a href="#hero" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#E51E3A] to-[#681B3F] flex items-center justify-center text-white shadow-md shadow-[#3B0D20]/40 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
              <Droplet className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-xl text-white tracking-tight">
                  BLOODLINK <span className="text-[#E51E3A]">AI</span>
                </span>
                <span className="px-1.5 py-0.2 rounded bg-white/15 text-[9px] font-black uppercase tracking-wider text-white/90">
                  Campus
                </span>
              </div>
              <span className="text-[10px] font-semibold text-white/75 tracking-wider block -mt-0.5">
                Smart Campus Blood Bank Platform
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links (Smooth scroll) */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs font-bold uppercase tracking-wider text-white/90">
            <a
              href="#hero"
              className="hover:text-white transition-colors duration-150 hover:underline underline-offset-8 decoration-[#E51E3A] decoration-2"
            >
              Home
            </a>
            <a
              href="#about"
              className="hover:text-white transition-colors duration-150 hover:underline underline-offset-8 decoration-[#E51E3A] decoration-2"
            >
              About Us
            </a>
            <a
              href="#why-donate"
              className="hover:text-white transition-colors duration-150 hover:underline underline-offset-8 decoration-[#E51E3A] decoration-2"
            >
              Why Donate Blood
            </a>
            <a
              href="#how-it-works"
              className="hover:text-white transition-colors duration-150 hover:underline underline-offset-8 decoration-[#E51E3A] decoration-2"
            >
              How It Works
            </a>
            <a
              href="#camps"
              className="hover:text-white transition-colors duration-150 hover:underline underline-offset-8 decoration-[#E51E3A] decoration-2"
            >
              Campus Blood Camps
            </a>
          </nav>

          {/* Desktop Action Buttons (Sign In + Donate Now) */}
          <div className="hidden sm:flex items-center space-x-3">
            <Link
              to="/login"
              className="px-4 py-2 text-white hover:text-white border border-white/30 hover:border-white hover:bg-white/10 rounded-full font-bold text-xs uppercase tracking-wider transition-all"
            >
              Sign In
            </Link>

            <Link
              to="/register"
              className="px-5 py-2.5 bg-[#E51E3A] hover:bg-[#c91530] text-white rounded-full font-black text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-95 flex items-center space-x-1.5"
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Donate Now</span>
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="lg:hidden flex items-center space-x-2">
            <Link
              to="/register"
              className="sm:hidden px-3.5 py-1.5 bg-[#E51E3A] text-white rounded-full font-black text-[11px] uppercase tracking-wider shadow-xs"
            >
              Donate Now
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-white hover:text-white rounded-xl hover:bg-white/10 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#3B0D20] border-t border-[#681B3F] px-4 pt-3 pb-6 space-y-3 animate-fade-in text-xs font-bold uppercase tracking-wider text-white/90">
            <a
              href="#hero"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-white/10 hover:text-white"
            >
              Home
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-white/10 hover:text-white"
            >
              About Us
            </a>
            <a
              href="#why-donate"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-white/10 hover:text-white"
            >
              Why Donate Blood
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-white/10 hover:text-white"
            >
              How It Works
            </a>
            <a
              href="#camps"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-white/10 hover:text-white"
            >
              Campus Blood Camps
            </a>

            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-white border border-white/30 rounded-xl"
              >
                Sign In to Portal
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 bg-[#E51E3A] hover:bg-[#c91530] text-white rounded-xl font-black shadow-md"
              >
                Register & Donate Now
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          2. HERO SECTION (Light off-white background #F8F7F5 - Clean, Calm & Spacious)
         ========================================================================= */}
      <section
        id="hero"
        className="relative overflow-hidden bg-[#F8F7F5] pt-12 pb-20 lg:pt-24 lg:pb-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Campus Context, Restrained Headline, Subtitle, Copy, Buttons */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Campus Context Badge */}
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-white border border-[#F1DDE3] rounded-full text-xs font-semibold text-[#681B3F] shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#E51E3A]"></span>
                <span>JC Bose UST YMCA • Smart Campus Blood Bank</span>
              </div>

              {/* Simple, Elegant Heading with Restrained Typography */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#42101F] tracking-tight leading-tight">
                To give is human
              </h1>

              {/* Subtitle */}
              <p className="text-xl sm:text-2xl font-semibold text-[#42101F] tracking-tight leading-snug">
                Save lives by helping collect sufficient, safe blood.
              </p>

              {/* Supporting Paragraph */}
              <p className="text-base sm:text-lg text-[#64748b] leading-relaxed font-normal max-w-xl">
                We connect voluntary student and faculty donors with scheduled campus blood donation camps, local district blood banks, and emergency hospital requests across Faridabad and Delhi NCR.
              </p>

              {/* Call to Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link
                  to="/register"
                  className="px-8 py-3.5 bg-[#E51E3A] hover:bg-[#c91530] text-white rounded-xl font-bold text-sm tracking-wide shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 group"
                >
                  <span>Donate Now</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>

                <a
                  href="#how-it-works"
                  className="px-7 py-3.5 bg-white hover:bg-[#F8F7F5] text-[#42101F] border border-[#42101F]/30 hover:border-[#42101F] rounded-xl font-bold text-sm tracking-wide shadow-xs transition-all flex items-center justify-center space-x-2"
                >
                  <span>Explore How It Works</span>
                </a>
              </div>
            </div>

            {/* Right Column: Minimal Animated Blood Droplet Visual with Generous Whitespace */}
            <div className="lg:col-span-5 flex items-center justify-center py-6 lg:py-0">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex flex-col items-center justify-end select-none">
                {/* Subtle soft ambient aura */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 rounded-full bg-[#E51E3A]/5 blur-2xl" />
                </div>

                {/* Minimal Animated Blood Drop falling under gravity */}
                <div className="absolute top-7 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                  <div className="animate-blood-drop">
                    <svg
                      viewBox="0 0 24 32"
                      className="w-7 h-9 drop-shadow-sm fill-[#E51E3A]"
                      aria-hidden="true"
                    >
                      <path d="M12 2 C12 2 4 13 4 20 C4 25.5 7.6 30 12 30 C16.4 30 20 25.5 20 20 C20 13 12 2 12 2 Z" />
                      {/* Specular highlight */}
                      <ellipse
                        cx="9"
                        cy="18"
                        rx="1.8"
                        ry="4"
                        fill="white"
                        fillOpacity="0.45"
                        transform="rotate(-20 9 18)"
                      />
                    </svg>
                  </div>
                </div>

                {/* Target Surface Disc with Expanding Impact Ripples */}
                <div className="relative z-0 mb-6 flex items-center justify-center">
                  {/* Expanding Ripple Rings on Droplet Impact */}
                  <div className="absolute w-20 h-20 rounded-full border border-[#E51E3A]/40 animate-surface-ripple pointer-events-none" />
                  <div className="absolute w-20 h-20 rounded-full border border-[#681B3F]/25 animate-surface-ripple-delayed pointer-events-none" />

                  {/* Surface Disc / Target Pedestal */}
                  <div className="relative w-20 h-20 rounded-full bg-white border border-[#F1DDE3] shadow-sm flex items-center justify-center animate-surface-pulse">
                    <div className="w-12 h-12 rounded-full bg-[#F8F7F5] border border-[#F1DDE3] flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-[#E51E3A]/15 border border-[#E51E3A]/30 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#E51E3A]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. KEY IMPACT NUMBERS BAND (Pure White #FFFFFF with subtle #F1DDE3 borders)
         ========================================================================= */}
      <section className="bg-white border-y border-[#F1DDE3] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-[#F1DDE3]">
            <div className="pt-4 md:pt-0">
              <span className="text-3xl sm:text-4xl font-black text-[#3B0D20] tracking-tight block">
                100%
              </span>
              <span className="text-xs font-bold text-[#718096] uppercase tracking-wider mt-1 block">
                Voluntary & Safe
              </span>
              <p className="text-[11px] text-[#475569] mt-0.5">Altruistic campus student and faculty community</p>
            </div>

            <div className="pt-4 md:pt-0">
              <span className="text-3xl sm:text-4xl font-black text-[#3B0D20] tracking-tight block">
                3 Lives
              </span>
              <span className="text-xs font-bold text-[#718096] uppercase tracking-wider mt-1 block">
                Saved Per Donation
              </span>
              <p className="text-[11px] text-[#475569] mt-0.5">Through red cells, plasma & platelet separation</p>
            </div>

            <div className="pt-4 md:pt-0">
              <span className="text-3xl sm:text-4xl font-black text-[#3B0D20] tracking-tight block">
                35–42 Days
              </span>
              <span className="text-xs font-bold text-[#718096] uppercase tracking-wider mt-1 block">
                Red Cell Shelf Life
              </span>
              <p className="text-[11px] text-[#475569] mt-0.5">Continuous regular campus drives are essential</p>
            </div>

            <div className="pt-4 md:pt-0">
              <span className="text-3xl sm:text-4xl font-black text-[#3B0D20] tracking-tight block">
                12,000+
              </span>
              <span className="text-xs font-bold text-[#718096] uppercase tracking-wider mt-1 block">
                Daily Units Needed
              </span>
              <p className="text-[11px] text-[#475569] mt-0.5">Across Indian trauma centers & emergency surgeries</p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. ABOUT BLOODLINK AI SECTION (#about) (Soft off-white background #F8F7F5)
         ========================================================================= */}
      <section id="about" className="py-20 lg:py-28 bg-[#F8F7F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-[#681B3F] bg-white px-3.5 py-1.5 rounded-full border border-[#F1DDE3] shadow-xs">
              About BloodLink AI
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#3B0D20] tracking-tight">
              Bridging Campus Donors With Critical Healthcare
            </h2>
            <p className="text-sm sm:text-base text-[#475569] leading-relaxed font-normal">
              BloodLink AI is a Smart Campus Blood Bank Platform engineered specifically for Indian universities and college communities.
              We transform student goodwill into a structured, rapid-response network that serves both scheduled drives and critical emergencies.
            </p>
          </div>

          {/* 4 Core Pillars Grid (Pure White Cards #FFFFFF with #F1DDE3 borders) */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1: College Students & Voluntary Donors */}
            <div className="bg-white p-7 rounded-3xl border border-[#F1DDE3] shadow-xs hover:shadow-md hover:border-[#681B3F]/40 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F8F7F5] text-[#681B3F] border border-[#F1DDE3] flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-[#3B0D20] leading-snug">
                  College Students & Voluntary Donors
                </h3>
                <p className="text-xs text-[#475569] leading-relaxed">
                  Students and faculty register with their college department and blood group. Real-time availability toggles and automated 90-day cooldown tracking ensure responsible voluntary participation.
                </p>
              </div>
              <div className="pt-3 border-t border-[#F1DDE3] text-[11px] font-bold text-[#681B3F] flex items-center space-x-1">
                <span>Personalized Donor Profiles</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Pillar 2: Campus Blood Camps */}
            <div className="bg-white p-7 rounded-3xl border border-[#F1DDE3] shadow-xs hover:shadow-md hover:border-[#681B3F]/40 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F8F7F5] text-[#E51E3A] border border-[#F1DDE3] flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-[#3B0D20] leading-snug">
                  Campus Blood Donation Camps
                </h3>
                <p className="text-xs text-[#475569] leading-relaxed">
                  Colleges host structured donation camps with accredited district blood banks. Students book 20-minute slots online between classes, preventing waiting lines and academic disruption.
                </p>
              </div>
              <div className="pt-3 border-t border-[#F1DDE3] text-[11px] font-bold text-[#E51E3A] flex items-center space-x-1">
                <span>Online Slot Booking</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Pillar 3: Hospitals & Authorized Blood Banks */}
            <div className="bg-white p-7 rounded-3xl border border-[#F1DDE3] shadow-xs hover:shadow-md hover:border-[#681B3F]/40 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F8F7F5] text-[#681B3F] border border-[#F1DDE3] flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-[#3B0D20] leading-snug">
                  Partner Hospitals & Blood Banks
                </h3>
                <p className="text-xs text-[#475569] leading-relaxed">
                  Direct digital connectivity with local civil hospitals and accredited regional blood banks in Faridabad and Delhi NCR. Enables verified inventory tracking and emergency request coordination.
                </p>
              </div>
              <div className="pt-3 border-t border-[#F1DDE3] text-[11px] font-bold text-[#681B3F] flex items-center space-x-1">
                <span>Verified Medical Network</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Pillar 4: Emergency SOS & Smart Dispatch */}
            <div className="bg-white p-7 rounded-3xl border border-[#F1DDE3] shadow-xs hover:shadow-md hover:border-[#681B3F]/40 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F8F7F5] text-[#E51E3A] border border-[#F1DDE3] flex items-center justify-center">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-[#3B0D20] leading-snug">
                  Emergency SOS & Smart Dispatch
                </h3>
                <p className="text-xs text-[#475569] leading-relaxed">
                  When critical trauma or emergency surgery demands immediate blood, automated algorithmic matching notifies compatible campus donors on standby, closing the urgent request loop in minutes.
                </p>
              </div>
              <div className="pt-3 border-t border-[#F1DDE3] text-[11px] font-bold text-[#E51E3A] flex items-center space-x-1">
                <span>Algorithmic Compatibility</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. WHY BLOOD DONATION MATTERS SECTION (#why-donate) (Pure White #FFFFFF)
             (Inspired directly by Screenshot 2: "WHY SAFE BLOOD SAVES LIVES")
         ========================================================================= */}
      <section id="why-donate" className="py-20 lg:py-28 bg-white border-t border-[#F1DDE3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Storytelling Narrative & Facts */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-[#F8F7F5] border border-[#F1DDE3] text-[#681B3F] rounded-full text-xs font-black uppercase tracking-wider">
                <HeartHandshake className="w-4 h-4 text-[#E51E3A]" />
                <span>The Life-Saving Imperative</span>
              </div>

              {/* Title from Reference Screenshot 2 */}
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#3B0D20] tracking-tight leading-tight">
                WHY SAFE BLOOD SAVES LIVES
              </h2>

              <p className="text-sm sm:text-base text-[#475569] leading-relaxed font-normal">
                Across low- and middle-income regions, hospitals face critical shortages of safe, screened blood.
                Emergency patients—especially women during childbirth hemorrhage, newborn infants, severe anemia
                patients, thalassaemia children, and road trauma victims—suffer and sometimes lose their lives
                due to the absence of immediate blood units.
              </p>

              <p className="text-sm text-[#475569] leading-relaxed">
                Because human blood cannot be synthetically manufactured in any lab, voluntary donation by healthy
                young adults on college campuses represents the most reliable, humane lifeline for regional hospitals.
              </p>

              {/* Verified Key Facts List with Icons (matching Screenshot 2 layout) */}
              <div className="space-y-4 pt-2">
                <div className="flex items-start space-x-3.5">
                  <div className="w-8 h-8 rounded-full bg-[#F8F7F5] border border-[#F1DDE3] text-[#E51E3A] flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[#3B0D20] text-sm">Every 2 seconds, someone in India needs blood.</h4>
                    <p className="text-xs text-[#718096] mt-0.5">Emergency surgeries, organ transplants, and trauma require continuous ready supply.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="w-8 h-8 rounded-full bg-[#F8F7F5] border border-[#F1DDE3] text-[#E51E3A] flex items-center justify-center shrink-0 mt-0.5">
                    <Heart className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[#3B0D20] text-sm">1 donation can save up to 3 patient lives.</h4>
                    <p className="text-xs text-[#718096] mt-0.5">Blood is separated into Packed Red Blood Cells (PRBC), Fresh Frozen Plasma (FFP), and Platelets.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="w-8 h-8 rounded-full bg-[#F8F7F5] border border-[#F1DDE3] text-[#E51E3A] flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[#3B0D20] text-sm">Completely safe, sterile, and replenishes quickly.</h4>
                    <p className="text-xs text-[#718096] mt-0.5">Your body replenishes the donated fluid volume within 24 to 48 hours and red blood cells in a few weeks.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  to="/register"
                  className="px-8 py-3.5 bg-[#E51E3A] hover:bg-[#c91530] text-white rounded-full font-black text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all inline-flex items-center space-x-2"
                >
                  <span>DONATE NOW</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right Healthcare Visual Card with Image & Inset Badge */}
            <div className="lg:col-span-5 relative">
              <div className="bg-[#F8F7F5] rounded-3xl p-6 border border-[#F1DDE3] shadow-md space-y-6">
                <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-4/3 shadow-inner">
                  {/* Stylized Healthcare illustration / banner in Deep Plum #681B3F */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-transparent z-10"></div>
                  <div className="absolute inset-0 flex flex-col justify-end p-6 z-20 text-white space-y-2">
                    <span className="px-2.5 py-1 bg-[#E51E3A] text-white rounded-md text-[10px] font-black uppercase tracking-wider inline-block w-max">
                      Medical Safety Protocol
                    </span>
                    <h4 className="text-lg font-black leading-snug">
                      Authorized Medical Officers & Phlebotomists
                    </h4>
                    <p className="text-xs text-white/80">
                      Every campus donation includes free blood pressure, pulse, weight, and hemoglobin screening before collection.
                    </p>
                  </div>
                  {/* Background graphic motif */}
                  <div className="w-full h-full bg-[#681B3F] flex items-center justify-center">
                    <Stethoscope className="w-24 h-24 text-white/20" />
                  </div>
                </div>

                {/* Additional Impact Card */}
                <div className="p-4 bg-white rounded-2xl border border-[#F1DDE3] shadow-xs flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-red-50 text-[#E51E3A] flex items-center justify-center shrink-0">
                    <Droplet className="w-6 h-6 fill-current" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-[#3B0D20] block">
                      Free Hemoglobin & Health Check
                    </span>
                    <span className="text-[11px] text-[#718096] block mt-0.5">
                      Donors receive health insights and certified blood group confirmation.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. INTERACTIVE BLOOD COMPATIBILITY EXPLORER (Soft off-white #F8F7F5)
         ========================================================================= */}
      <section className="py-16 bg-[#F8F7F5] border-y border-[#F1DDE3]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#681B3F] bg-white px-3.5 py-1 rounded-full border border-[#F1DDE3]">
              Educational Guide
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-[#3B0D20] tracking-tight">
              Know Your Blood Compatibility
            </h3>
            <p className="text-xs sm:text-sm text-[#475569] max-w-lg mx-auto">
              Select your blood group to see who your donation can directly save.
            </p>
          </div>

          {/* Blood Group Selectors */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {Object.keys(BLOOD_COMPATIBILITY).map((group) => {
              const isActive = selectedGroup === group;
              return (
                <button
                  key={group}
                  onClick={() => setSelectedGroup(group)}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl font-black text-sm transition-all shadow-xs flex items-center justify-center ${
                    isActive
                      ? 'bg-[#681B3F] text-white scale-105 shadow-md ring-4 ring-[#F1DDE3]'
                      : 'bg-white text-[#475569] hover:bg-white/80 border border-[#F1DDE3] hover:border-[#681B3F]/40 hover:text-[#3B0D20]'
                  }`}
                >
                  {group}
                </button>
              );
            })}
          </div>

          {/* Compatibility Details Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#F1DDE3] shadow-xs max-w-3xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F1DDE3] gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#718096]">Selected Blood Group</span>
                <h4 className="text-2xl font-black text-[#3B0D20]">
                  Blood Group: {selectedGroup}
                </h4>
              </div>
              <span className="px-3 py-1 bg-[#F8F7F5] text-[#681B3F] border border-[#F1DDE3] rounded-full text-xs font-black uppercase tracking-wider self-start sm:self-auto">
                {currentCompat.rarity}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>You Can Give Red Cells To:</span>
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {currentCompat.give.map((grp) => (
                    <span
                      key={grp}
                      className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-900 rounded-lg text-xs font-black"
                    >
                      {grp}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-2xl space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-800 flex items-center space-x-1.5">
                  <Heart className="w-3.5 h-3.5 text-blue-600" />
                  <span>You Can Receive Red Cells From:</span>
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {currentCompat.receive.map((grp) => (
                    <span
                      key={grp}
                      className="px-2.5 py-1 bg-white border border-blue-300 text-blue-900 rounded-lg text-xs font-black"
                    >
                      {grp}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-xs text-[#475569] bg-[#F8F7F5] p-3.5 rounded-xl border border-[#F1DDE3] flex items-start space-x-2">
              <Info className="w-4 h-4 text-[#681B3F] shrink-0 mt-0.5" />
              <span><strong>Campus Context:</strong> {currentCompat.note}</span>
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. HOW IT WORKS SECTION (#how-it-works) (Pure White #FFFFFF)
         ========================================================================= */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-white border-t border-[#F1DDE3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-[#681B3F] bg-[#F8F7F5] px-3.5 py-1.5 rounded-full border border-[#F1DDE3]">
              Simple 3-Step Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#3B0D20] tracking-tight">
              How Campus Blood Donation Works
            </h2>
            <p className="text-sm sm:text-base text-[#475569] leading-relaxed font-normal">
              From creating your campus profile to receiving your official blood donation receipt and certificate of appreciation, the journey is smooth and transparent.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-[#F8F7F5] p-8 rounded-3xl border border-[#F1DDE3] shadow-xs relative space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-[#681B3F] text-white flex items-center justify-center font-black text-xl shadow-xs">
                1
              </div>
              <h3 className="text-xl font-black text-[#3B0D20]">
                Register in 60 Seconds
              </h3>
              <p className="text-xs text-[#475569] leading-relaxed">
                Sign up with your college email, department (e.g. Computer Science, Mechanical), and blood group. Set your availability status to Available or Under Cooldown whenever needed.
              </p>
              <div className="pt-2">
                <span className="px-2.5 py-1 rounded-md bg-white border border-[#F1DDE3] text-[10px] font-bold text-[#718096]">
                  ✓ Free & Confidential
                </span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-[#F8F7F5] p-8 rounded-3xl border border-[#F1DDE3] shadow-xs relative space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-[#E51E3A] text-white flex items-center justify-center font-black text-xl shadow-xs">
                2
              </div>
              <h3 className="text-xl font-black text-[#3B0D20]">
                Book a Camp Slot or Answer an SOS
              </h3>
              <p className="text-xs text-[#475569] leading-relaxed">
                Choose a convenient 20-minute slot during campus donation drives, or receive urgent app notifications when a patient at a nearby hospital requires your specific blood group.
              </p>
              <div className="pt-2">
                <span className="px-2.5 py-1 rounded-md bg-white border border-[#F1DDE3] text-[10px] font-bold text-[#718096]">
                  ✓ Zero Waiting Line
                </span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-[#F8F7F5] p-8 rounded-3xl border border-[#F1DDE3] shadow-xs relative space-y-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-[#3B0D20] text-white flex items-center justify-center font-black text-xl shadow-xs">
                3
              </div>
              <h3 className="text-xl font-black text-[#3B0D20]">
                Verified Donation & Certificate
              </h3>
              <p className="text-xs text-[#475569] leading-relaxed">
                Undergo quick confidential screening with medical officers. Once collected, immediately download your verified <strong>Donation Receipt</strong> for college records and your <strong>Certificate of Appreciation</strong>.
              </p>
              <div className="pt-2">
                <span className="px-2.5 py-1 rounded-md bg-white border border-[#F1DDE3] text-[10px] font-bold text-[#718096]">
                  ✓ Instant Downloadable PDF
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. CAMPUS BLOOD CAMPS SECTION (#camps) (Soft off-white #F8F7F5)
         ========================================================================= */}
      <section id="camps" className="py-20 lg:py-28 bg-[#F8F7F5] border-t border-[#F1DDE3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-[#681B3F] bg-white px-3.5 py-1.5 rounded-full border border-[#F1DDE3]">
              Campus Drives & Events
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#3B0D20] tracking-tight">
              Organized Campus Blood Camps
            </h2>
            <p className="text-sm sm:text-base text-[#475569] leading-relaxed font-normal">
              Colleges and universities organize regular donation camps in campus auditoriums and health centers in collaboration with government hospital blood centers and the Indian Red Cross Society.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-[#F1DDE3] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#F8F7F5] text-[#681B3F] border border-[#F1DDE3] flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <h4 className="font-black text-[#3B0D20] text-base">Advance Slot Booking</h4>
              <p className="text-xs text-[#475569] leading-relaxed">
                Students can select their preferred time slot right from their student portal, preventing crowds during peak lunch hours and class breaks.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#F1DDE3] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#F8F7F5] text-[#E51E3A] border border-[#F1DDE3] flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-black text-[#3B0D20] text-base">Qualified Medical Teams</h4>
              <p className="text-xs text-[#475569] leading-relaxed">
                Camps are operated by doctors and trained technicians from accredited hospitals using sterile, disposable medical collection kits.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#F1DDE3] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#F8F7F5] text-amber-700 border border-[#F1DDE3] flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="font-black text-[#3B0D20] text-base">Academic Recognition</h4>
              <p className="text-xs text-[#475569] leading-relaxed">
                Participating students receive verified attendance receipts for academic leave, plus a commemorative certificate signed by campus coordinators.
              </p>
            </div>
          </div>

          {/* Next Camp Highlight Box (Single Deep Plum Accent Container #681B3F) */}
          <div className="bg-gradient-to-r from-[#681B3F] to-[#3B0D20] rounded-3xl p-8 sm:p-10 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="px-3 py-1 bg-white/15 rounded-full text-[10px] font-black uppercase tracking-wider text-white">
                Upcoming University Drive
              </span>
              <h3 className="text-2xl sm:text-3xl font-black">
                JC Bose UST Campus Blood Donation Drive
              </h3>
              <p className="text-xs sm:text-sm text-white/80 max-w-xl">
                Location: Campus Health Centre, Sector 6, Faridabad. Jointly organized with District Red Cross Blood Centre. Open to all students & faculty.
              </p>
            </div>

            <div className="shrink-0 flex items-center space-x-3">
              <Link
                to="/register"
                className="px-6 py-3.5 bg-[#E51E3A] hover:bg-[#c91530] text-white rounded-full font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all hover:scale-105"
              >
                Book Your Slot
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          9. FINAL CALL TO ACTION (#cta) (Intentional Deep-Plum Feature Section)
         ========================================================================= */}
      <section className="py-20 lg:py-24 bg-white border-t border-[#F1DDE3]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#3B0D20] via-[#50132F] to-[#681B3F] text-white rounded-[2.5rem] p-10 sm:p-16 shadow-xl relative overflow-hidden text-center space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-black uppercase tracking-wider text-white/90">
              <Heart className="w-3.5 h-3.5 fill-current text-[#E51E3A]" />
              <span>Make An Impact Today</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white max-w-2xl mx-auto">
              Be Someone's Reason To Live.
            </h2>

            <p className="text-sm sm:text-base text-white/80 max-w-xl mx-auto leading-relaxed">
              Your voluntary donation takes less than 30 minutes, but it can grant an emergency patient decades of birthdays.
              Join thousands of fellow students and faculty members across the campus.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto px-9 py-4 bg-[#E51E3A] hover:bg-[#c91530] text-white rounded-full font-black text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
              >
                <span>Donate Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 bg-transparent hover:bg-white/10 text-white border border-white/40 rounded-full font-bold text-sm tracking-wide transition-all flex items-center justify-center"
              >
                Sign In to Portal
              </Link>
            </div>

            <div className="pt-6 border-t border-white/15 flex flex-wrap items-center justify-center gap-6 text-[11px] text-white/75">
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Free & Voluntary</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Confidential Campus Network</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Official Academic Receipt & Certificate</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          10. FOOTER (Dark Plum #230713 / #3B0D20 - Sophisticated & Elegant)
         ========================================================================= */}
      <footer className="bg-[#230713] text-slate-300 border-t border-[#3B0D20] pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Col 1: Branding & Mission */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-[#E51E3A] flex items-center justify-center text-white shadow-md">
                  <Droplet className="w-4.5 h-4.5 fill-current" />
                </div>
                <span className="font-black text-xl text-white tracking-tight">
                  BLOODLINK <span className="text-[#E51E3A]">AI</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Smart Campus Blood Bank Platform connecting college donors, campus donation drives, and hospital emergency requests.
              </p>
              <div className="text-[11px] font-semibold text-slate-300">
                Institutional Node: <br />
                <span className="text-white">JC Bose University of Science & Technology, YMCA</span>
              </div>
            </div>

            {/* Col 2: Navigation Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-white">
                Quick Navigation
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#hero" className="hover:text-white transition-colors">Home</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#why-donate" className="hover:text-white transition-colors">Why Donate Blood</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#camps" className="hover:text-white transition-colors">Campus Blood Camps</a></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Donor Registration</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              </ul>
            </div>

            {/* Col 3: Campus Headquarters */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-white">
                Campus Location
              </h4>
              <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
                <p className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-[#E51E3A] shrink-0 mt-0.5" />
                  <span>Campus Health Centre & Red Cross Cell, Sector 6, Mathura Road, Faridabad, Haryana 121006</span>
                </p>
                <p className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-[#E51E3A] shrink-0" />
                  <span>Affiliated with District Red Cross Blood Centre</span>
                </p>
              </div>
            </div>

            {/* Col 4: Emergency Assistance */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-white">
                Emergency Support
              </h4>
              <div className="space-y-2 text-xs text-slate-400">
                <p className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-[#E51E3A] shrink-0" />
                  <span>+91 129 224 1500 (Campus Desk)</span>
                </p>
                <p className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-[#E51E3A] shrink-0" />
                  <span>+91 98765 43210 (24/7 SOS Helpline)</span>
                </p>
                <p className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-[#E51E3A] shrink-0" />
                  <span>bloodbank@bloodlink.ai</span>
                </p>
                <div className="pt-2">
                  <span className="px-2 py-1 bg-[#3B0D20] border border-[#681B3F] rounded-md text-[10px] font-bold text-slate-200 inline-block">
                    🚨 24/7 Emergency Blood Coordination
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Disclaimer */}
          <div className="pt-8 border-t border-[#3B0D20] flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-4">
            <p>
              © 2026 BloodLink AI – Smart Campus Blood Bank Platform. Built for Indian Colleges & Voluntary Donors.
            </p>
            <div className="flex items-center space-x-4">
              <span>Medically Supervised</span>
              <span>•</span>
              <span>100% Voluntary</span>
              <span>•</span>
              <span>Confidential Data</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
