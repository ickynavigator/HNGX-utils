import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { type AppType } from 'next/app';
import Head from 'next/head';
import Layout from '~/components/Layout';
import { RouterTransition } from '~/components/RouterTransition';
import { api } from '~/utils/api';

const MyApp: AppType = props => {
  const { Component, pageProps } = props;

  return (
    <>
      <Head>
        <title>HNGx Utils</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{
          colorScheme: 'light',
        }}
      >
        <ModalsProvider>
          <RouterTransition />
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </ModalsProvider>
      </MantineProvider>
    </>
  );
};

export default api.withTRPC(MyApp);
