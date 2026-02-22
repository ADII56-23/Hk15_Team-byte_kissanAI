import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Cpu, LineChart, ShieldCheck, Zap, ArrowLeft, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const WhyAiPage: React.FC = () => {
  const newsLinks = [
    { title: "AI in agri sector to boost job opportunities", source: "The Hindu BusinessLine", href: "https://www.thehindubusinessline.com" },
    { title: "Maharashtra To Host ‘AI For Agri 2026’ Global Conference", source: "Financial Express", href: "https://www.financialexpress.com" },
    { title: "Maharashtra to expand AI in agriculture, build digital infra", source: "Fortune India", href: "https://www.fortuneindia.com" },
    { title: "Leveraging artificial intelligence in agribusiness", source: "Springer Nature", href: "https://link.springer.com" },
    { title: "Empowering Agricultural Communities through AI-Powered Solutions", source: "ORF", href: "https://www.orfonline.org" },
    { title: "Artificial Intelligence (AI) in Indian Agriculture", source: "Vision IAS", href: "https://www.visionias.in" }
  ];

  return (
    <div className="bg-white min-h-screen font-sans text-earth-dark selection:bg-earth-main selection:text-white">
      {/* Article Header */}
      <header className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&q=80&w=2000"
          alt="Modern Agriculture"
          className="absolute inset-0 w-full h-full object-cover grayscale-[20%] brightness-[40%]"
        />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <Link to="/" className="bg-white/10 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/20 transition-all">
              <ArrowLeft size={20} />
            </Link>
            <span className="bg-earth-main text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">Research Report 2026</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-[0.9]"
          >
            Artificial Intelligence in Agriculture: <br />
            <span className="text-earth-sand underline decoration-earth-main underline-offset-8">Why It Matters.</span>
          </motion.h1>
        </div>
      </header>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-6 py-24">
        <section className="prose prose-earth lg:prose-xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-3xl font-black text-earth-dark mb-8 flex items-center gap-4">
              <BrainCircuit className="text-earth-main" size={40} />
              The Mandate for Modernization
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed font-medium">
              Agriculture faces mounting challenges: <span className="text-earth-dark font-bold">climate change, resource scarcity, labor shortages</span>, and the demand for sustainable food production. Artificial Intelligence (AI) offers powerful solutions by enabling precision farming, where data-driven insights guide every step of cultivation. AI helps farmers increase yields, reduce waste, and adapt to unpredictable conditions, making farming smarter and more resilient.
            </p>
          </motion.div>

          {/* Transform Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
            <div className="space-y-8">
              <h3 className="text-2xl font-black text-earth-dark border-b-4 border-earth-main pb-4 inline-block">How AI Transforms Farming</h3>
              <div className="space-y-8">
                {[
                  { icon: Cpu, title: "Crop Monitoring", desc: "AI-powered sensors and drones track plant health, soil moisture, and pest activity in real time." },
                  { icon: LineChart, title: "Predictive Analytics", desc: "Machine learning models forecast weather patterns, crop diseases, and yield outcomes, allowing proactive decisions." },
                  { icon: Zap, title: "Automation", desc: "Robotics and smart machinery reduce manual labor, optimize irrigation, and ensure precise fertilizer use." },
                  { icon: ShieldCheck, title: "Resource Optimization", desc: "AI minimizes water, fertilizer, and pesticide usage, lowering costs and environmental impact." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="shrink-0 p-3 bg-earth-beige rounded-2xl h-fit">
                      <item.icon className="text-earth-main" size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-earth-dark">{item.title}</h4>
                      <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative group">
              <img
                src="https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&q=80&w=1000"
                alt="AI Drone Agriculture"
                className="rounded-[3rem] shadow-2xl group-hover:scale-[1.02] transition-transform duration-500"
              />
              <div className="absolute -bottom-6 -right-6 bg-earth-dark text-white p-8 rounded-3xl shadow-2xl max-w-[200px]">
                <p className="text-xs font-black uppercase tracking-widest text-earth-sand mb-2">Key Metric</p>
                <p className="text-2xl font-bold">40% Efficiency Boost</p>
              </div>
            </div>
          </div>

          {/* Requirements Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gray-50 p-12 rounded-[4rem] border border-gray-100 mb-20"
          >
            <h3 className="text-3xl font-black text-earth-dark mb-10 text-center">What Is Needed for AI Adoption</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[
                { title: "Data Infrastructure", desc: "Reliable collection of soil, weather, and crop data through IoT devices and sensors." },
                { title: "Connectivity", desc: "Strong rural internet access to support cloud-based AI platforms." },
                { title: "Training & Skills", desc: "Farmers and workers need digital literacy to use AI tools effectively." },
                { title: "Policy Support", desc: "Governments must provide incentives, subsidies, and frameworks for adoption." },
                { title: "Scalable Solutions", desc: "Affordable AI technologies tailored for small and medium farms." }
              ].map((item, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <h5 className="font-black text-earth-main mb-2 tracking-tight">{item.title}</h5>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Industry References */}
          <div className="mb-20">
            <h3 className="text-2xl font-black text-earth-dark mb-8 flex items-center gap-3">
              <ExternalLink className="text-earth-main" size={24} />
              Industry References & Journals
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {newsLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-6 bg-white border border-gray-100 rounded-2xl hover:border-earth-main hover:shadow-xl transition-all group"
                >
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{link.source}</p>
                  <h6 className="font-bold text-earth-dark group-hover:text-earth-main transition-colors">{link.title}</h6>
                </a>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="bg-earth-beige p-12 rounded-[3rem] text-center"
          >
            <h3 className="text-3xl font-black text-earth-dark mb-4 uppercase">Conclusion</h3>
            <p className="text-lg text-gray-700 font-medium">
              AI is not just a technological upgrade—it is a necessity for the future of agriculture. By combining data, automation, and predictive intelligence, AI empowers farmers to produce more with fewer resources, ensuring food security and sustainability for generations to come.
            </p>
            <div className="mt-10">
              <Link to="/dashboard" className="bg-earth-dark text-white px-8 py-4 rounded-full font-bold hover:bg-earth-main transition-all inline-flex items-center gap-2">
                Join the Future Matrix <Cpu size={20} />
              </Link>
            </div>
          </motion.div>
        </section>
      </article>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-50 text-center">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Research by FarmCopilot Intelligence Unit © 2026</p>
      </footer>
    </div>
  );
};

export default WhyAiPage;
