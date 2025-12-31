import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleServiceChange = (value) => {
    setFormData({
      ...formData,
      service: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Form submission logic will be added with backend
    console.log('Form submitted:', formData);
    toast({
      title: "Quote Request Received!",
      description: "We'll get back to you within 24 hours.",
    });
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      service: '',
      message: ''
    });
  };

  return (
    <section id="contact" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-black mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Get in <span className="text-red-600">Touch</span>
            </h2>
            <div className="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Ready to start your project? Contact us for a free consultation and quote
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h3 className="text-3xl font-bold text-black mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Contact Information
              </h3>
              <p className="text-gray-600 mb-8" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Reach out to discuss your interior finishing needs. We service Coastal B.C and Vancouver Island regions and are ready to bring your project to life.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-red-600 p-3 rounded-lg mr-4">
                    <MapPin className="text-white" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-black mb-1" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Service Area</h4>
                    <p className="text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>Okanagan Region, British Columbia</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-red-600 p-3 rounded-lg mr-4">
                    <Phone className="text-white" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-black mb-1" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Phone</h4>
                    <p className="text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>Contact us for phone details</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-red-600 p-3 rounded-lg mr-4">
                    <Mail className="text-white" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-black mb-1" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Email</h4>
                    <p className="text-gray-600" style={{ fontFamily: 'Open Sans, sans-serif' }}>info@twofungis.com</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-black rounded-lg">
                <h4 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Business Hours
                </h4>
                <div className="space-y-2 text-gray-300" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                  <p>Monday - Friday: 7:00 AM - 5:00 PM</p>
                  <p>Saturday: 8:00 AM - 2:00 PM</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-black font-semibold">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="mt-2 border-gray-300 focus:border-red-600 focus:ring-red-600"
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-black font-semibold">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="mt-2 border-gray-300 focus:border-red-600 focus:ring-red-600"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-black font-semibold">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-2 border-gray-300 focus:border-red-600 focus:ring-red-600"
                    placeholder="(250) 555-1234"
                  />
                </div>

                <div>
                  <Label htmlFor="service" className="text-black font-semibold">Service Needed *</Label>
                  <Select onValueChange={handleServiceChange} value={formData.service}>
                    <SelectTrigger className="mt-2 border-gray-300 focus:border-red-600 focus:ring-red-600">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential Finishing</SelectItem>
                      <SelectItem value="commercial">Commercial Millwork</SelectItem>
                      <SelectItem value="multi-unit">Multi-Unit Residential</SelectItem>
                      <SelectItem value="high-rise">High-Rise Projects</SelectItem>
                      <SelectItem value="other">Other / Not Sure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message" className="text-black font-semibold">Project Details *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="mt-2 border-gray-300 focus:border-red-600 focus:ring-red-600"
                    placeholder="Tell us about your project..."
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg font-semibold transition-all duration-200 hover:scale-105"
                >
                  <Send className="mr-2" size={20} />
                  Send Quote Request
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;