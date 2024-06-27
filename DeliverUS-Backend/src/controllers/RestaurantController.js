import { Sequelize } from 'sequelize'
import { Restaurant, Product, RestaurantCategory, ProductCategory } from '../models/models.js'

const index = async function (req, res) {
  try {
    const restaurants = await Restaurant.findAll(
      {
        attributes: { exclude: ['userId'] },
        include:
      {
        model: RestaurantCategory,
        as: 'restaurantCategory'
      },
        order: [[{ model: RestaurantCategory, as: 'restaurantCategory' }, 'name', 'ASC']]
      }
    )
    res.json(restaurants)
  } catch (err) {
    res.status(500).send(err)
  }
}

// solucion
async function getPinnedRestaurants (req) {
  return await Restaurant.findAll({
    attributes: { exclude: ['userId'] },
    where: {
      userId: req.user.id,
      pinned: true,
      pinnedAt: {
        [Sequelize.Op.not]: null
      }
    },
    order: [['pinnedAt', 'ASC']],
    include: [{
      model: RestaurantCategory,
      as: 'restaurantCategory'
    }]
  })
}

// solucion
async function getNotPinnedRestaurants (req) {
  return await Restaurant.findAll({
    attributes: { exclude: ['userId'] },
    where: {
      userId: req.user.id,
      pinned: false,
      pinnedAt: null
    },
    include: [{
      model: RestaurantCategory,
      as: 'restaurantCategory'
    }]
  })
}

const indexOwner = async function (req, res) {
  try {
    // solucion
    const restaurants = [...(await getPinnedRestaurants(req)), ...(await getNotPinnedRestaurants(req))]
    res.json(restaurants)
  } catch (err) {
    res.status(500).send(err)
  }
}

const create = async function (req, res) {
  // solucion
  try {
    if (req.body.pinned === true) {
      req.body.pinnedAt = new Date()
    } else {
      req.body.pinnedAt = null
    }
    const newRestaurant = Restaurant.build(req.body)
    newRestaurant.userId = req.user.id // usuario actualmente autenticado

    const restaurant = await newRestaurant.save()
    res.json(restaurant)
  } catch (err) {
    res.status(500).send(err)
  }
}

const show = async function (req, res) {
  // Only returns PUBLIC information of restaurants
  try {
    const restaurant = await Restaurant.findByPk(req.params.restaurantId, {
      attributes: { exclude: ['userId'] },
      include: [{
        model: Product,
        as: 'products',
        include: { model: ProductCategory, as: 'productCategory' }
      },
      {
        model: RestaurantCategory,
        as: 'restaurantCategory'
      }],
      order: [[{ model: Product, as: 'products' }, 'order', 'ASC']]
    }
    )
    res.json(restaurant)
  } catch (err) {
    res.status(500).send(err)
  }
}

const update = async function (req, res) {
  try {
    await Restaurant.update(req.body, { where: { id: req.params.restaurantId } })
    const updatedRestaurant = await Restaurant.findByPk(req.params.restaurantId)
    res.json(updatedRestaurant)
  } catch (err) {
    res.status(500).send(err)
  }
}

// solucion
const patch = async function (req, res) {
  try {
    const restaurant = await Restaurant.findByPk(req.params.restaurantId)
    await Restaurant.update(
      { pinned: !restaurant.pinned, pinnedAt: restaurant.pinnedAt !== null ? null : new Date() },
      { where: { id: restaurant.id } }
    )
    const patchedRestaurant = await Restaurant.findByPk(req.params.restaurantId)
    res.json(patchedRestaurant)
  } catch (err) {
    res.status(500).send(err)
  }
}

const destroy = async function (req, res) {
  try {
    const result = await Restaurant.destroy({ where: { id: req.params.restaurantId } })
    let message = ''
    if (result === 1) {
      message = 'Sucessfuly deleted restaurant id.' + req.params.restaurantId
    } else {
      message = 'Could not delete restaurant.'
    }
    res.json(message)
  } catch (err) {
    res.status(500).send(err)
  }
}

const RestaurantController = {
  index,
  indexOwner,
  create,
  show,
  update,
  destroy,
  patch
}
export default RestaurantController
