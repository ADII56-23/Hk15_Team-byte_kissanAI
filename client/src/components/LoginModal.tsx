import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Github, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ChevronRight,
  Chrome,
  WalletCards
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-[480px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden font-sans"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute right-6 top-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
            >
              <X size={20} />
            </button>

            <div className="p-8 pt-10">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-gray-900 mb-2">Create your account</h2>
                <p className="text-gray-500 text-sm font-medium">Welcome! Please fill in the details to get started.</p>
              </div>

              {/* Social Logins */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <button className="flex items-center justify-center py-3.5 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all group">
                  <Github size={20} className="text-gray-900 group-hover:scale-110 transition-transform" />
                </button>
                <button className="flex items-center justify-center py-3.5 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all group">
                  <Chrome size={20} className="text-[#4285F4] group-hover:scale-110 transition-transform" />
                </button>
                <button className="flex items-center justify-center py-3.5 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all group">
                   <WalletCards size={20} className="text-[#F6851B] group-hover:scale-110 transition-transform" />
                </button>
              </div>

              {/* Divider */}
              <div className="relative mb-8 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <span className="relative bg-white px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none">or</span>
              </div>

              {/* Form */}
              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="email" 
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-medium"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Terms & Privacy */}
                <div className="flex items-start space-x-3 pt-2">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      checked={agreed}
                      onChange={() => setAgreed(!agreed)}
                      className="w-5 h-5 border-2 border-gray-200 rounded-md checked:bg-indigo-600 checked:border-indigo-600 transition-all cursor-pointer accent-indigo-600"
                    />
                  </div>
                  <p className="text-sm text-gray-500 font-medium leading-tight">
                    I agree to the <a href="#" className="text-indigo-600 underline decoration-indigo-200 underline-offset-4 hover:text-indigo-700 transition-colors">Terms of Service</a> and <a href="#" className="text-indigo-600 underline decoration-indigo-200 underline-offset-4 hover:text-indigo-700 transition-colors">Privacy Policy</a>
                  </p>
                </div>

                <button 
                  className="w-full bg-[#6366f1] hover:bg-[#585ce5] text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-200 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] group mt-4"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  <span className="text-sm">Continue</span>
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </div>

            {/* Footer */}
            <div className="bg-gray-50/80 border-t border-gray-100 py-6 text-center">
              <p className="text-gray-500 text-sm font-medium">
                Already have an account? <button className="text-indigo-600 font-black hover:text-indigo-700 transition-colors">Sign in</button>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
