import * as PropTypes from 'prop-types'
import * as React from 'react'

interface Props {
  title: string
}

export default class ReactSVG extends React.Component<
  Props &
    React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLDivElement>,
      HTMLDivElement
    >
> {
  static defaultProps = {
    title: 'hello'
  }

  static propTypes = {
    title: PropTypes.string,
  }

  render() {
    const {
      title
    } = this.props

    return (
      <span>{title}</span>
    )
  }
}
