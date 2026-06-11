import { render, screen } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('shows loading spinner when isLoading', () => {
    const { container } = render(<Button isLoading>Save</Button>)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('is disabled when isLoading', () => {
    render(<Button isLoading>Save</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
