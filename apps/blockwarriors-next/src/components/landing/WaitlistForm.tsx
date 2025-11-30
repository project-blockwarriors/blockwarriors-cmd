'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMutation } from 'convex/react';
import { api } from '@/lib/convex';

const classYears = [
  '2025',
  '2026',
  '2027',
  '2028',
  '2029',
  'Graduate',
  'Other',
];
const degreeTypes = [
  'Undergraduate',
  'Masters',
  'PhD',
  'Postdoc',
  'Faculty/Staff',
  'Other',
];

interface WaitlistFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WaitlistForm({ isOpen, onClose }: WaitlistFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    class_year: '',
    degree_type: '',
  });
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [message, setMessage] = useState('');

  const joinWaitlist = useMutation(api.waitlist.joinWaitlist);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const result = await joinWaitlist({
        name: formData.name,
        email: formData.email,
        class_year: formData.class_year,
        degree_type: formData.degree_type,
      });

      if (result.success) {
        setStatus('success');
        setMessage(result.message);
      } else {
        setStatus('error');
        setMessage(result.message);
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form after animation
    setTimeout(() => {
      setFormData({ name: '', email: '', class_year: '', degree_type: '' });
      setStatus('idle');
      setMessage('');
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="relative w-full max-w-md bg-card border border-white/10 rounded-2xl p-6 shadow-2xl pointer-events-auto">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {status === 'success' ? (
                /* Success State */
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-minecraft-grass/20 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-minecraft-grass" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    You&apos;re on the list!
                  </h3>
                  <p className="text-muted-foreground mb-6">{message}</p>
                  <Button
                    onClick={handleClose}
                    className="bg-gradient-to-r from-princeton-orange to-princeton-orange-light text-black font-semibold"
                  >
                    Close
                  </Button>
                </motion.div>
              ) : (
                /* Form State */
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Join the Waitlist
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Be the first to know when registration opens for
                      BlockWarriors Spring 2026.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-white mb-1.5"
                      >
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-4 py-2.5 bg-background border border-white/10 rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-princeton-orange/50 focus:border-princeton-orange transition-all"
                        placeholder="John Doe"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-white mb-1.5"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full px-4 py-2.5 bg-background border border-white/10 rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-princeton-orange/50 focus:border-princeton-orange transition-all"
                        placeholder="john@princeton.edu"
                      />
                    </div>

                    {/* Class Year */}
                    <div>
                      <label
                        htmlFor="class_year"
                        className="block text-sm font-medium text-white mb-1.5"
                      >
                        Class Year
                      </label>
                      <select
                        id="class_year"
                        required
                        value={formData.class_year}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            class_year: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-background border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-princeton-orange/50 focus:border-princeton-orange transition-all appearance-none cursor-pointer"
                      >
                        <option value="" disabled>
                          Select your class year
                        </option>
                        {classYears.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Degree Type */}
                    <div>
                      <label
                        htmlFor="degree_type"
                        className="block text-sm font-medium text-white mb-1.5"
                      >
                        Degree Type
                      </label>
                      <select
                        id="degree_type"
                        required
                        value={formData.degree_type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            degree_type: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-background border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-princeton-orange/50 focus:border-princeton-orange transition-all appearance-none cursor-pointer"
                      >
                        <option value="" disabled>
                          Select your degree type
                        </option>
                        {degreeTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Error message */}
                    {status === 'error' && (
                      <p className="text-red-400 text-sm">{message}</p>
                    )}

                    {/* Submit button */}
                    <Button
                      type="submit"
                      disabled={status === 'loading'}
                      className="w-full bg-gradient-to-r from-princeton-orange to-princeton-orange-light text-black font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {status === 'loading' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Join Waitlist
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
