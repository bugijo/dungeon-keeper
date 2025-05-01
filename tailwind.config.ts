
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
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
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Fantasy theme colors
				fantasy: {
					dark: '#1A1F2C',
					purple: '#6E59A5',
					gold: '#FFC107',
					accent: '#8B5CF6',
					gem: '#D946EF',
					enchanted: '#A78BFA',
					rare: '#60A5FA',
					legendary: '#F59E0B',
					paper: '#F3E8C8',
					stone: '#64748B',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'pulse-glow': {
					'0%, 100%': { 
						opacity: '1',
						filter: 'brightness(1)'
					},
					'50%': { 
						opacity: '0.9',
						filter: 'brightness(1.2)'
					}
				},
				'float': {
					'0%, 100%': { 
						transform: 'translateY(0px)'
					},
					'50%': { 
						transform: 'translateY(-10px)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
				'float': 'float 5s ease-in-out infinite'
			},
			backgroundImage: {
				'fantasy-gradient': 'linear-gradient(to bottom, rgba(26, 31, 44, 0.8), rgba(26, 31, 44, 0.95))',
				'card-gradient': 'linear-gradient(to bottom, rgba(110, 89, 165, 0.1), rgba(139, 92, 246, 0.05))',
				'gold-gradient': 'linear-gradient(to bottom, #FFC107, #FFD700)',
				'gem-gradient': 'linear-gradient(to bottom, #D946EF, #8B5CF6)',
				'rare-gradient': 'linear-gradient(to bottom, #60A5FA, #3B82F6)',
				'legendary-gradient': 'linear-gradient(to bottom, #F59E0B, #D97706)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
