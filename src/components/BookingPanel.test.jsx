import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BookingPanel from './BookingPanel'

test('switches to cargo fields', async () => {
  const user = userEvent.setup()
  render(<BookingPanel />)
  await user.click(screen.getByRole('tab', { name: /cargo/i }))
  expect(screen.getByLabelText(/cargo type/i)).toBeInTheDocument()
  expect(screen.queryByLabelText(/passengers/i)).not.toBeInTheDocument()
})

test('announces a clearly labelled demo result', async () => {
  const user = userEvent.setup()
  render(<BookingPanel />)
  await user.click(screen.getByRole('button', { name: /search routes/i }))
  expect(screen.getByRole('status')).toHaveTextContent(/demo route preview/i)
})
