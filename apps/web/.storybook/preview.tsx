import type { Preview, Decorator } from '@storybook/react'
import { useEffect } from 'react'
import { ThemeProvider } from 'next-themes'
import '../src/index.css'

const ThemeDecorator: Decorator = (Story, context) => {
  const theme = context.globals.theme || 'light'

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={theme}
      forcedTheme={theme}
      enableSystem={false}
      disableTransitionOnChange
    >
      <div className={theme === 'dark' ? 'dark' : ''}>
        <div className="bg-background text-foreground min-h-screen p-4">
          <Story />
        </div>
      </div>
    </ThemeProvider>
  )
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: { disable: true },
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
  decorators: [ThemeDecorator],
}

export default preview
