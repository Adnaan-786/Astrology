/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
    	extend: {
    		colors: {
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			chart: {
    				'1': 'hsl(var(--chart-1))',
    				'2': 'hsl(var(--chart-2))',
    				'3': 'hsl(var(--chart-3))',
    				'4': 'hsl(var(--chart-4))',
    				'5': 'hsl(var(--chart-5))'
    			},
    			// AstroVedic Custom Colors
    			cosmic: {
    				indigo: '#2D1B69',
    				gold: '#D4A017',
    				purple: '#8B5CF6',
    				dark: '#0D0B1E',
    				light: '#F8F6FF',
    				surface: '#1E1B3A',
    				'surface-light': '#2A2650',
    			}
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		fontFamily: {
    			cinzel: ['Cinzel', 'serif'],
    			inter: ['Inter', 'sans-serif'],
    			hindi: ['Noto Sans Devanagari', 'sans-serif']
    		},
    		animation: {
    			'twinkle': 'twinkle 3s ease-in-out infinite',
    			'float': 'float 6s ease-in-out infinite',
    			'glow': 'glow 2s ease-in-out infinite alternate',
    			'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    			'spin-slow': 'spin 20s linear infinite',
    		},
    		keyframes: {
    			twinkle: {
    				'0%, 100%': { opacity: '0.3' },
    				'50%': { opacity: '1' }
    			},
    			float: {
    				'0%, 100%': { transform: 'translateY(0px)' },
    				'50%': { transform: 'translateY(-20px)' }
    			},
    			glow: {
    				'0%': { boxShadow: '0 0 5px #D4A017, 0 0 10px #D4A017' },
    				'100%': { boxShadow: '0 0 20px #D4A017, 0 0 30px #D4A017' }
    			}
    		},
    		backgroundImage: {
    			'cosmic-gradient': 'linear-gradient(135deg, #0D0B1E 0%, #2D1B69 50%, #1E1B3A 100%)',
    			'gold-gradient': 'linear-gradient(135deg, #D4A017 0%, #F5D76E 50%, #D4A017 100%)',
    		}
    	}
    },
    plugins: [require("tailwindcss-animate")],
}
