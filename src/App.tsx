import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

enum Direction {
  ArrowUp,
  ArrowLeft,
  ArrowDown,
  ArrowRight
}

const getNextPosition = (direction: Direction, x: number, y: number): [number, number] => {
  switch (direction) {
    case Direction.ArrowDown:
      return [x, y + 1];
    case Direction.ArrowUp:
      return [x, y - 1 ? y - 1 : y];
    case Direction.ArrowRight:
      return [x + 1, y];
    case Direction.ArrowLeft:
      return [x - 1 ? x - 1 : x, y];
    default:
      return [x, y]
  }
}

const int = (num: number) => num <= 0 ? 1 : num

let intervalStarted = false;

function App() {
  const [[x, y], setPosition] = useState([1, 1])
  const direction = useRef([]);
  const position = useRef([1, 1])
  position.current = [x, y]
  const [attacking, setAttack] = useState(false)

  useEffect(() => {
    if (!intervalStarted) {
      intervalStarted = true
      document.onkeydown = (e) => {
        if (Direction[e.key]) {
          direction.current = [...direction.current, Direction[e.key]]
        }
        if (e.key == " " || e.key == "f") {
          setAttack(true);
          setTimeout(() => setAttack(false), 150)
        }
      };
      document.onkeyup = (e) => {
        if (Direction[e.key]) {
          direction.current = direction.current.filter(d => d != Direction[e.key]);
        }
      }
      setInterval(() => {
        if (direction.current.length) {
          setPosition(getNextPosition(
            direction.current[direction.current.length - 1],
            position.current[0],
            position.current[1]))
        }
      }, 17)
    }
  }, [])

  return (
    <AppContainer>
      <Board>
        <Token x={x} y={y} attacking={attacking} />
      </Board>
    </AppContainer>
  )
}

const Token = styled.div(({ x, y, attacking }: { x: number, y: number, attacking: boolean }) => ({
  gridColumn: `${attacking ? int(x - 2) : x} / span ${attacking ? 14 : 10}`,
  gridRow: `${attacking ? int(y - 2) : y} / span ${attacking ? 14 : 10}`,
  backgroundColor: attacking ? "red" : "blue",
}));

const AppContainer = styled.div({
  boxSizing: "border-box",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "100vw",
  height: "100vh",
});

const Board = styled.div({
  display: "grid",
  gridTemplateColumns: "repeat(500, 1fr)",
  gridTemplateRows: "repeat(500, 1fr)",
  width: "99vh",
  height: "99vh",
  transition: "200ms ease-in",
  border: "1px solid black",
  backgroundColor: "lightgray"
})

export default App
