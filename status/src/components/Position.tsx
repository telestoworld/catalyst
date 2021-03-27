import React from 'react'
export function Position(props: { coordinate: string }) {
  return (
    <a target="_blank" rel="noopener noreferrer" href={`https://play.telestoworld.org/?position=${props.coordinate}`}>
      {props.coordinate}
    </a>
  )
}
