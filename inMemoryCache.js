let instance = null
class InMemoryCache {
  #cache = {}  
  constructor(baseContent = {}) {
    if (!instance) {
      instance = this
      instance.#cache = baseContent
    }
    return instance
  }

  isOnCache(key) {
    return Boolean(instance.#cache[key])
  }

  add(key, value) {
    instance.#cache[key] = value
  }

  remove(key) {
    if (this.#cache[key]) {
      delete instance.#cache[key]
    } else {
      console.log(`${key} not found`)
    }
  }
}

module.exports = InMemoryCache