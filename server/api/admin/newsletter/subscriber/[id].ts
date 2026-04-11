import { defineEventHandler } from 'h3'
import { throwMethodNotAllowed } from '../../../../utils/throwMethodNotAllowed'

export default defineEventHandler(() => throwMethodNotAllowed())
