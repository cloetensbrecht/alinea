// Todo: find the smallest css in js runtime lib for this purpose
import {css} from '@stitches/react'
import {
  CSSProperties,
  forwardRef,
  HTMLAttributes,
  HTMLProps,
  PropsWithChildren,
  PropsWithRef
} from 'react'
import {styler} from './util/Styler'
import {px} from './util/Units'

export type StackProps = PropsWithRef<
  Omit<HTMLProps<HTMLDivElement>, 'wrap'> & {
    gap?: number | string
    direction?: CSSProperties['flexDirection']
    align?: CSSProperties['alignItems']
    justify?: CSSProperties['justifyContent']
    horizontal?: boolean
    wrap?: boolean
    center?: boolean
    full?: boolean
    autoWidth?: boolean
  }
>

function stack(props: StackProps) {
  const direction = props.direction || 'column'
  const styles: any = {
    display: 'flex',
    minWidth: 0,
    flexDirection: direction,
    alignItems: props.center ? 'center' : props.align || 'unset',
    justifyContent: props.justify || 'unset',
    '>*+*': {
      [direction === 'row' ? 'marginLeft' : 'marginTop']: px(props.gap || 0)
    }
  }
  if (props.wrap) {
    styles.flexWrap = 'wrap'
    styles.marginTop = `-${px(props.gap || 0)}`
    styles.marginLeft = `-${px(props.gap || 0)}`
    styles['>*'] = {
      marginTop: px(props.gap || 0),
      marginLeft: px(props.gap || 0)
    }
  }
  if (props.full) {
    styles[direction === 'row' ? 'width' : 'height'] = '100%'
  }
  return styles
}

const cache = new Map()

export const VStack = forwardRef<HTMLDivElement, StackProps>(function VStack(
  props,
  ref
) {
  const {
    children,
    as: tag = 'div',
    gap,
    align,
    direction,
    justify,
    center,
    wrap,
    full,
    ...rest
  } = props
  const key = `${gap}-${align}-${direction}-${justify}-${center}-${wrap}-${full}`
  const Tag = tag as any
  if (!cache.has(key)) cache.set(key, styler(css(stack(props))()))
  const className = cache.get(key)
  const inner = (
    <Tag {...rest} className={className.mergeProps(rest)()} ref={ref}>
      {children}
    </Tag>
  )
  if (!wrap) return inner
  return <div>{inner}</div>
})

export const HStack: typeof VStack = forwardRef(function HStack(props, ref) {
  return <VStack direction="row" {...props} ref={ref} />
})

export namespace Stack {
  export function Left(
    props: PropsWithChildren<HTMLAttributes<HTMLDivElement>>
  ) {
    return <div {...props} style={{...props.style, marginRight: 'auto'}} />
  }
  export function Center(
    props: PropsWithChildren<HTMLAttributes<HTMLDivElement>>
  ) {
    return (
      <div
        {...props}
        style={{...props.style, marginRight: 'auto', marginLeft: 'auto'}}
      />
    )
  }
  export function Right(
    props: PropsWithChildren<HTMLAttributes<HTMLDivElement>>
  ) {
    return <div {...props} style={{...props.style, marginLeft: 'auto'}} />
  }
}
