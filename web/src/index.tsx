/* @refresh reload */
import './index.css';

import { render } from 'solid-js/web';
import { Router } from '@solidjs/router';

import { routes } from './routes.tsx';

render(() => <Router>{routes}</Router>, document.body!);
