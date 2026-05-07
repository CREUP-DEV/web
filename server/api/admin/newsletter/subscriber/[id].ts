import { defineEventHandler } from 'h3'
import { throwMethodNotAllowed } from '../../../../utils/core/throwMethodNotAllowed'

export default defineEventHandler(() => throwMethodNotAllowed())
