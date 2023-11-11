/* eslint-disable import/no-extraneous-dependencies */
// Used to create custom htm-preact dependency file
import {
  h,
  Component,
  createContext,
  createRef,
  render,
} from 'preact';
import { signal } from '@preact/signals';
import {
  useState,
  useReducer,
  useEffect,
  useLayoutEffect,
  useRef,
  useImperativeHandle,
  useMemo,
  useCallback,
  useContext,
  useDebugValue,
  useErrorBoundary,
  useId,
// eslint-disable-next-line import/extensions
} from 'preact/hooks';
import htm from 'htm';

const html = htm.bind(h);

export {
  h,
  html,
  signal,
  render,
  Component,
  createContext,
  createRef,
  useState,
  useReducer,
  useEffect,
  useLayoutEffect,
  useRef,
  useImperativeHandle,
  useMemo,
  useCallback,
  useContext,
  useDebugValue,
  useErrorBoundary,
  useId,
};
