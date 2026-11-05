import { render, screen, fireEvent, act } from '@testing-library/react';
import { createRef } from 'react';
import { ScenePlayer, ScenePoster, type ScenePlayerHandle } from '../src/player';
import { loadScenes } from '../src/tools/scenes';

const { scenes } = loadScenes();
const slappa = scenes.get('anim.slappa.1')!;

describe('ScenePlayer', () => {
  beforeEach(() => { document.documentElement.className = ''; });
  it('renders an accessible SVG and advances with requestAnimationFrame', async () => {
    let now = 0; const cbs: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { cbs.push(cb); return cbs.length; });
    const ref = createRef<ScenePlayerHandle>();
    render(<ScenePlayer ref={ref} scene={slappa} autoplay size={180} controls />);
    expect(screen.getByRole('img', { name: 'slappa' })).toBeInTheDocument();
    await act(async () => { now += 16; cbs.shift()?.(now); now += 500; cbs.shift()?.(now); });
    expect(ref.current!.timeMs).toBeGreaterThan(400);
    vi.restoreAllMocks();
  });
  it('starts on the poster frame with a play button when the host asks for reduced motion', () => {
    document.documentElement.classList.add('reduce-motion');
    const ref = createRef<ScenePlayerHandle>();
    render(<ScenePlayer ref={ref} scene={slappa} autoplay size={180} />);
    expect(ref.current!.timeMs).toBe(2600);
    expect(screen.getByRole('button', { name: /Spela upp animationen slappa/ })).toBeInTheDocument();
  });
  it('full-motion class overrides the OS setting; controls play, pause and seek', () => {
    document.documentElement.classList.add('full-motion');
    const ref = createRef<ScenePlayerHandle>();
    render(<ScenePlayer ref={ref} scene={slappa} size={180} controls />);
    act(() => ref.current!.seek(1234));
    expect(ref.current!.timeMs).toBe(1234);
    fireEvent.change(screen.getByLabelText('Tidslinje'), { target: { value: '900' } });
    expect(ref.current!.timeMs).toBe(900);
    fireEvent.click(screen.getByLabelText('Repris'));
    expect(ref.current!.timeMs).toBe(0);
  });
  it('ScenePoster renders the poster frame as a static image', () => {
    render(<ScenePoster scene={slappa} size={140} />);
    const img = screen.getByRole('img', { name: 'slappa' });
    expect(img.getAttribute('width')).toBe('140');
  });
});
