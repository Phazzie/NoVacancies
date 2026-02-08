import globals from 'globals';

export default [
    {
        files: ['tests/e2e/**/*.js', 'tests/noGeminiActivePaths.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.node,
                console: 'readonly',
                process: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-console': 'off',
            'prefer-const': 'error',
            'no-var': 'error',
            'eqeqeq': ['error', 'always'],
            'no-undef': 'error'
        }
    }
];
