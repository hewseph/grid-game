import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
// @ts-nocheck
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
const tokenSpan = 10;
const bulletSpan = 5;

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

let intervalId: number
let intervalStarted = false;

function App() {
  const [state, setPosition] = useState<State>({
    position: [250, 250],
    bullets: []
  })
  const [x, y] = state.position
  const direction = useRef<Direction[]>([]);
  const position = useRef<[number, number]>([250, 250])
  const bullets = useRef<IBullet[]>([])
  bullets.current = state.bullets
  position.current = [x, y]
  const [attacking, setAttack] = useState(false)
  const [gameover, setGameover] = useState(false)

  useEffect(() => {
    if (!intervalStarted) {
      intervalStarted = true
      document.onkeydown = ({ key }: { key: string }) => {
        if (Direction[(key as keyof typeof Direction)]) {
          direction.current = [...direction.current, Direction[(key as keyof typeof Direction)]]
        }
        if (key == " " || key == "f") {
          setAttack(true);
          setTimeout(() => setAttack(false), 150)
        }
      };
      document.onkeyup = ({ key }: { key: string }) => {
        if (Direction[(key as keyof typeof Direction)]) {
          direction.current = direction.current.filter(d => d != Direction[(key as keyof typeof Direction)]);
        }
      }

      setTimeout(() => {
        setPosition(prevState => ({
          ...prevState,
          bullets: [...prevState.bullets, fireBullet()]
        }))
      }, 1000)

      intervalId = setInterval(() => {
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
        const updateToken = (): [number, number] => {
          if (direction.current.length) {
            return getNextPosition(
              direction.current[direction.current.length - 1],
              position.current[0],
              position.current[1])
          }
          return position.current;
        }

        const nextState = {
          position: updateToken(),
          bullets: [
            ...updateBullets(),
            ...(Math.random() < 0.1) ? [fireBullet()] : []
          ]
        }

        nextState.bullets.forEach(bullet => {
          const Tx = nextState.position[0];
          const TxMax = Tx + tokenSpan - 1
          const Ty = nextState.position[1]
          const TyMax = Ty + tokenSpan - 1

          const Bx = bullet.position[0]
          const BxMax = Bx + bulletSpan - 1
          const By = bullet.position[1]
          const ByMax = By + bulletSpan - 1

          if (
            ((Bx >= Tx && Bx <= TxMax) || (BxMax >= Tx && BxMax <= TxMax))
            && ((By >= Ty && By <= TyMax) || (ByMax >= Ty && ByMax <= TyMax))
          ) {
            clearInterval(intervalId)
            setGameover(true)
          }
        })

        setPosition(nextState)
      }, 17)
    }
  }, [])

  return (
    <AppContainer>
      {gameover && (<GameOverText>GameOver</GameOverText>)}
      <Board>
        <Token style={{
          gridColumn: `${attacking ? int(x - 2) : x} / span ${attacking ? 14 : tokenSpan}`,
          gridRow: `${attacking ? int(y - 2) : y} / span ${attacking ? 14 : tokenSpan}`,
          backgroundColor: attacking ? "red" : "blue",
        }} />
        {bullets.current.map(bullet => (
          <Bullet style={{
            gridColumn: `${attacking ? int(bullet.position[0] - 2) : bullet.position[0]} / span ${bulletSpan}`,
            gridRow: `${attacking ? int(bullet.position[1] - 2) : bullet.position[1]} / span ${bulletSpan}`,
            backgroundColor: "red",
          }} />
        ))}
      </Board>
    </AppContainer>
  )
}
const GameOverText = styled.h1({
  position: "fixed",
  left: "46%",
  top: "46%",
  fontSize: "32px",
  color: "orange",
  zIndex: 2,
  padding: "8px",
  backgroundColor: "#FFF9"
})

// @ts-ignore
const Token = styled.div.attrs(({ style }) => ({
  style: style
}))``

// @ts-ignore
const Bullet = styled.div.attrs(({ style }) => ({
  style: style
}))``

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
