'use strict';

const { toPlural, toSingular, toInputName } = require('../old/naming');

describe('Name util', () => {
  it('Pluralizes with camelcase', () => {
    expect(toPlural('post')).toBe('posts');
    expect(toPlural('posts')).toBe('posts');
    expect(toPlural('Posts')).toBe('posts');
    expect(toPlural('home-page')).toBe('homePages');
  });

  it('Casts to singular with camelcase', () => {
    expect(toSingular('post')).toBe('post');
    expect(toSingular('posts')).toBe('post');
    expect(toSingular('Posts')).toBe('post');
    expect(toSingular('home-pages')).toBe('homePage');
  });

  it('Generates valid input type names', () => {
    expect(toInputName('post')).toBe('PostInput');
    expect(toInputName('posts')).toBe('PostInput');
    expect(toInputName('home-page')).toBe('HomePageInput');
  });
});
