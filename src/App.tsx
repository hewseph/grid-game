import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
type Position = [number, number]

const start = Date.now()
let end: number;

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
const attackExtra = 2;
const attackSpanWide = 14;
const attackSpanLength = 3;

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
    speed: Math.random() < 0.5 ? 3 : Math.random() < 0.5 ? 4 : 2,
    position: getStartPosition(direction),
    isTerminated: terminationFunc[direction] as () => boolean,
  }
}

const getNextPosition = (direction: Direction, [x, y]: [number, number], speed: number = 1): [number, number] => {
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

const getBounds = ([posX, posY]: [number, number], span: number): number[] => {
  return [posX, posX + span - 1, posY, posY + span - 1]
}

const getAttackSpace = (position: Position, facing: Direction): Position => {
  const [l, r, t, b] = getBounds(position, tokenSpan)
  switch (facing) {
    case Direction.ArrowDown:
      return [l - 2, b]
    case Direction.ArrowLeft:
      return [l - attackSpanWide, t - 2]
    case Direction.ArrowRight:
      return [r, t - 2]
    case Direction.ArrowUp:
      return [l - 2, t - 14]
  }
  return [-200, -200];
}

const int = (num: number) => num <= 0 ? 1 : num

let intervalId: any
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
  const facing = useRef<Direction>(Direction.ArrowDown);
  bullets.current = state.bullets
  position.current = [x, y]
  const [attacking, setAttack] = useState(false)
  const [gameover, setGameover] = useState(false)
  const [defeated, setDefeated] = useState(0)

  const [Ax, Ay] = getAttackSpace(position.current, facing.current)
  const attackingRef = useRef<Position>([Ax, Ay])
  attackingRef.current = attacking ? [Ax, Ay] : [-200, -200];

  useEffect(() => {
    if (!intervalStarted) {
      intervalStarted = true
      document.onkeydown = ({ key }: { key: string }) => {
        const dir = Direction[(key as keyof typeof Direction)]
        if (dir) {
          if (!direction.current.includes(dir)) {
            facing.current = dir;
            direction.current = [...direction.current, dir]
          }
        }
        if (key == " " || key == "f") {
          setAttack(true);
          setTimeout(() => setAttack(false), 150)
        }
      };
      document.onkeyup = ({ key }: { key: string }) => {
        const dir = Direction[(key as keyof typeof Direction)]
        if (dir) {
          direction.current = direction.current.filter(d => d != dir);
          facing.current = direction.current[direction.current.length - 1] || dir
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
                bullet.position,
                bullet.speed
              )
            }))
        }
        const updateToken = (): [number, number] => {
          if (direction.current.length) {
            return getNextPosition(
              direction.current[direction.current.length - 1],
              position.current, 2)
          }
          return position.current;
        }

        const nextState = {
          position: updateToken(),
          bullets: [
            ...updateBullets(),
            ...(Math.random() < 0.18) ? [fireBullet()] : []
          ]
        }

        const isCollision = (pos1: Position, span1: number, pos2: Position, span2: number): boolean => {
          const [Tx, TxMax, Ty, TyMax] = getBounds(pos1, span1);
          const [Bx, BxMax, By, ByMax] = getBounds(pos2, span2);

          return ((Bx >= Tx && Bx <= TxMax) || (BxMax >= Tx && BxMax <= TxMax))
            && ((By >= Ty && By <= TyMax) || (ByMax >= Ty && ByMax <= TyMax))
        }

        nextState.bullets = nextState.bullets.filter(bullet => {
          console.log(attackingRef.current)
          if (isCollision(attackingRef.current, attackSpanWide, bullet.position, bulletSpan)) {
            console.log("HERE")
            setDefeated(prevState => (prevState + 1))
            return false
          }
          if (isCollision(nextState.position, tokenSpan, bullet.position, bulletSpan)) {
            end = Date.now();
            clearInterval(intervalId)
            setGameover(true)
          }
          return true
        })

        setPosition(nextState)
      }, 17)
    }
  }, [])


  return (
    <AppContainer>
      {gameover && (<GameOverText>GameOver:<br />{(end - start) / 1000} seconds <br /> Defeated {defeated}</GameOverText>)}
      <Board>
        {attacking &&
          <div
            style={{
              gridColumn: `${Ax} / span ${attackSpanWide}`,
              gridRow: `${Ay} / span ${attackSpanWide}`,
              backgroundColor: "green",
            }}
          />
        }
        <Token style={{
          gridColumn: `${x} / span ${tokenSpan}`,
          gridRow: `${y} / span ${tokenSpan}`,
          backgroundColor: "blue",
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

const Token = styled.div({})
const Bullet = styled.div({})

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
  border: "1px solid black",
  backgroundColor: "lightgray"
})

export default App
