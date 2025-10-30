// This file centralizes the Tailwind CSS configuration.
// It is loaded in the <head> of each HTML file right after the Tailwind CDN script.

tailwind.config = {
    theme: {
        extend: {
            fontFamily: {
                'sans': ['Montserrat', 'sans-serif'],
            },
            colors: {
                'brand-teal': {
                    light: '#94d2bd',
                    DEFAULT: '#0a9396',
                    dark: '#005f73'
                },
                'brand-navy': '#001219',
            }
        }
    }
};
