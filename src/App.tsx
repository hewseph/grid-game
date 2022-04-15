import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

type Position = [number, number]

enum Direction {
  Still,
  ArrowUp,
  ArrowLeft,
  ArrowDown,
  ArrowRight
}

interface IBullet {
  direction: Direction,
  speed: number,
  position: Position,
  isTerminated: ([x, y]: Position) => boolean,
}

interface State {
  position: [number, number],
  bullets: IBullet[]
}

const size = 500

const randomNum = (max: number) => Math.floor(
  Math.random() * max
) + 1

const terminationFunc = {
  [Direction.Still]: () => true,
  [Direction.ArrowUp]: ([, y]: Position): boolean => y <= 1,
  [Direction.ArrowDown]: ([, y]: Position): boolean => y >= size,
  [Direction.ArrowLeft]: ([x]: Position): boolean => x <= 1,
  [Direction.ArrowRight]: ([x]: Position): boolean => x >= size,
}

const variableStart = () => randomNum(size)

const RndDirecton = (): Direction => randomNum(4)

const getStartPosition = (direction: Direction): Position => {
  switch (direction) {
    case Direction.ArrowDown:
      return [variableStart(), 0]
    case Direction.ArrowUp:
      return [variableStart(), size]
    case Direction.ArrowRight:
      return [0, variableStart()]
    case Direction.ArrowLeft:
      return [size, variableStart()]
    default:
      return [1, 1]
  }
}

const fireBullet = (): IBullet => {
  const direction = RndDirecton()
  return {
    direction,
    speed: 2,
    position: getStartPosition(direction),
    isTerminated: terminationFunc[direction] as () => boolean,
  }
}

const getNextPosition = (direction: Direction, x: number, y: number, speed: number = 1): [number, number] => {
  switch (direction) {
    case Direction.ArrowDown:
      return [x, y + speed];
    case Direction.ArrowUp:
      return [x, (y - speed || y - 1) ? (y - speed || y - 1) : y];
    case Direction.ArrowRight:
      return [x + speed, y];
    case Direction.ArrowLeft:
      return [(x - speed || x - 1) ? (x - speed || x - 1) : x, y];
    default:
      return [x, y]
  }
}

const int = (num: number) => num <= 0 ? 1 : num

let intervalStarted = false;

function App() {
  const [state, setPosition] = useState<State>({
    position: [1, 1],
    bullets: []
  })
  const [x, y] = state.position
  const direction = useRef([]);
  const position = useRef([1, 1])
  const bullets = useRef<IBullet[]>([])
  bullets.current = state.bullets
  position.current = [x, y]
  const [attacking, setAttack] = useState(false)

  useEffect(() => {
    if (!intervalStarted) {
      intervalStarted = true
      document.onkeydown = ({ key }: { key: string }) => {
        if (Direction[key]) {
          direction.current = [...direction.current, Direction[key]]
        }
        if (key == " " || key == "f") {
          setAttack(true);
          setTimeout(() => setAttack(false), 150)
        }
      };
      document.onkeyup = ({ key }: { key: string }) => {
        if (Direction[key]) {
          direction.current = direction.current.filter(d => d != Direction[key]);
        }
      }

      setTimeout(() => {
        setPosition(prevState => ({
          ...prevState,
          bullets: [...prevState.bullets, fireBullet()]
        }))
      }, 1000)

      setInterval(() => {
        const updateBullets = () => {
          return bullets.current
            .filter(bullet => !bullet.isTerminated(bullet.position))
            .map(bullet => ({
              ...bullet,
              position: getNextPosition(
                bullet.direction,
                bullet.position[0],
                bullet.position[1],
                bullet.speed
              )
            }))
        }
        const updateToken = () => {
          if (direction.current.length) {
            return getNextPosition(
              direction.current[direction.current.length - 1],
              position.current[0],
              position.current[1])
          }
          return position.current;
        }

        var d = Math.random();

        setPosition(prevState => ({
          ...prevState,
          position: updateToken(),
          bullets: [
            ...updateBullets(),
            ...(d < 0.1) ? [fireBullet()] : []
          ]
        }))
      }, 17)
    }
  }, [])

  return (
    <AppContainer>
      <Board>
        <Token x={x} y={y} attacking={attacking} />
        {bullets.current.map(bullet => (
          <Bullet x={bullet.position[0]} y={bullet.position[1]} attacking={true} />
        ))}
      </Board>
    </AppContainer>
  )
}

const Token = styled.div.attrs(({ x, y, attacking }: { x: number, y: number, attacking: boolean }) => ({
  style: {
    gridColumn: `${attacking ? int(x - 2) : x} / span ${attacking ? 14 : 10}`,
    gridRow: `${attacking ? int(y - 2) : y} / span ${attacking ? 14 : 10}`,
    backgroundColor: attacking ? "red" : "blue",
  }
}))``

const Bullet = styled.div.attrs(({ x, y, attacking }: { x: number, y: number, attacking: boolean }) => ({
  style: {
    gridColumn: `${x} / span 5`,
    gridRow: `${y} / span 5`,
    backgroundColor: "red",
  }
}))``
// const Component = styled.div.attrs(props => ({
//   style: {
//     background: props.background,
//   },
// }))`width: 100%;

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
